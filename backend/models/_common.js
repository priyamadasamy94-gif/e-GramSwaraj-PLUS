const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/db');

function toWhere(model, filter = {}) {
  const result = {};
  for (const [key, value] of Object.entries(filter || {})) {
    if (key === '$or' || key === '$and') {
      result[key === '$or' ? Op.or : Op.and] = value.map((part) => toWhere(model, part));
      continue;
    }
    if (value instanceof RegExp) {
      const source = value.source;
      const pattern = source.replace(/^\^/, '').replace(/\$$/, '').replace(/\\(.)/g, '$1').replace(/[%_]/g, '\\$&');
      result[key] = { [Op.like]: `${source.startsWith('^') ? '' : '%'}${pattern}${source.endsWith('$') ? '' : '%'}` };
      continue;
    }
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      const operators = {};
      for (const [operator, operand] of Object.entries(value)) {
        if (operator === '$regex') {
          const source = String(operand);
          const pattern = source.replace(/^\^/, '').replace(/\$$/, '').replace(/\\(.)/g, '$1').replace(/[%_]/g, '\\$&');
          operators[Op.like] = `%${pattern}%`;
          continue;
        }
        const mapped = {
          $in: Op.in, $ne: Op.ne, $gte: Op.gte, $lte: Op.lte,
          $gt: Op.gt, $lt: Op.lt, $exists: (exists) => exists ? { [Op.not]: null } : { [Op.is]: null },
        }[operator];
        if (typeof mapped === 'function') Object.assign(operators, mapped(operand));
        else if (mapped) operators[mapped] = operand;
      }
      result[key] = Reflect.ownKeys(operators).length ? operators : value;
      continue;
    }
    result[key] = value;
  }
  return result;
}

function parseOrder(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    return Object.entries(value).map(([field, direction]) => [field, Number(direction) < 0 ? 'DESC' : 'ASC']);
  }
  return String(value || '-createdAt').split(/\s+/).filter(Boolean).map((field) => [field.replace(/^-/, ''), field.startsWith('-') ? 'DESC' : 'ASC']);
}

function parseSelection(model, value) {
  const fields = String(value || '').split(/\s+/).filter(Boolean);
  const include = fields.filter((field) => !field.startsWith('-') && !field.startsWith('+'));
  const exclude = fields.filter((field) => field.startsWith('-')).map((field) => field.slice(1));
  let attributes = include.length ? [...new Set(['_id', ...include])] : Object.keys(model.rawAttributes).filter((field) => !exclude.includes(field));
  if (!include.length && model.hiddenAttributes) attributes = attributes.filter((field) => !model.hiddenAttributes.includes(field));
  for (const field of fields.filter((field) => field.startsWith('+'))) attributes.push(field.slice(1));
  return [...new Set(attributes)];
}

function parsePopulate(model, value) {
  const paths = Array.isArray(value) ? value : String(value || '').split(/\s+/).filter(Boolean);
  return paths.map((entry) => {
    const path = typeof entry === 'string' ? entry : entry.path;
    const association = model.associations[path] || model.associations[model.populateAliases?.[path] || path];
    if (!association) return null;
    const select = typeof entry === 'string' ? '' : entry.select || '';
    const include = { association, required: false };
    if (select) include.attributes = parseSelection(association.target, select);
    return include;
  }).filter(Boolean);
}

class QueryChain {
  constructor(model, one, where) {
    this.model = model;
    this.one = one;
    let actualWhere = where;
    let extraOptions = {};
    if (where && typeof where === 'object' && !Array.isArray(where)) {
      if ('where' in where && typeof where.where === 'object' && where.where !== null) {
        const { where: subWhere, order, sort, limit, offset, skip, select, attributes, include, populate, ...rest } = where;
        actualWhere = { ...subWhere, ...rest };
        if (order || sort) extraOptions.order = parseOrder(order || sort);
        if (limit !== undefined) extraOptions.limit = Number(limit);
        if (offset !== undefined || skip !== undefined) extraOptions.offset = Number(offset ?? skip) || 0;
        if (select || attributes) extraOptions.attributes = parseSelection(model, select || attributes);
        if (populate || include) extraOptions.include = parsePopulate(model, populate || include);
      }
    }
    this.options = { where: toWhere(model, actualWhere), ...extraOptions };
    if (model.hiddenAttributes?.length && !this.options.attributes) this.options.attributes = parseSelection(model, '');
  }

  sort(value) { this.options.order = parseOrder(value); return this; }
  skip(value) { this.options.offset = Number(value) || 0; return this; }
  limit(value) { this.options.limit = Number(value); return this; }
  select(value) { this.options.attributes = parseSelection(this.model, value); return this; }
  populate(value) {
    this.options.include = [...(this.options.include || []), ...parsePopulate(this.model, value)];
    return this;
  }
  exec() { return this.one ? this.model._findOneNative(this.options) : this.model._findAllNative(this.options); }
  then(resolve, reject) { return this.exec().then(resolve, reject); }
  catch(reject) { return this.exec().catch(reject); }
  finally(callback) { return this.exec().finally(callback); }
}

function defineModel(name, attributes, options = {}) {
  const definitions = { ...attributes };
  for (const [field, attribute] of Object.entries(definitions)) {
    if (attribute.type?.key === 'DECIMAL' && !attribute.get) {
      definitions[field] = {
        ...attribute,
        get() {
          const value = this.getDataValue(field);
          return value == null ? value : Number(value);
        },
      };
    }
  }
  const model = sequelize.define(name, {
    _id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    ...definitions,
  }, { tableName: options.tableName || `${name[0].toLowerCase()}${name.slice(1)}s`, ...options });
  model.addHook('beforeSave', 'markJsonAttributesChanged', (record) => {
    for (const [field, attribute] of Object.entries(model.rawAttributes)) {
      if (attribute.type.key === 'JSON' && record.getDataValue(field) !== undefined) record.changed(field, true);
    }
  });

  model.modelName = name;
  model.schema = { path: (field) => model.rawAttributes[field] };
  const findOneNative = model.findOne.bind(model);
  const findAllNative = model.findAll.bind(model);
  model._findOneNative = findOneNative;
  model._findAllNative = findAllNative;
  model.find = (where) => new QueryChain(model, false, where);
  model.findOne = (where) => new QueryChain(model, true, where);
  model.findById = (id) => model.findOne({ _id: id });
  model.countDocuments = (where = {}) => model.count({ where: toWhere(model, where) });
  model.findOneAndDelete = async (where) => {
    const doc = await findOneNative({ where: toWhere(model, where) });
    if (doc) await doc.destroy();
    return doc;
  };
  model.deleteOne = async (where = {}) => {
    const doc = await findOneNative({ where: toWhere(model, where) });
    if (doc) await doc.destroy();
    return { deletedCount: doc ? 1 : 0 };
  };
  model.deleteMany = async (where = {}) => model.destroy({ where: toWhere(model, where) });
  model.insertMany = (rows, options = {}) => {
    const { ordered, ...bulkOptions } = options;
    return model.bulkCreate(rows, { validate: true, ignoreDuplicates: ordered === false, ...bulkOptions });
  };
  model.exists = async (where = {}) => Boolean(await findOneNative({ where: toWhere(model, where), attributes: ['_id'] }));
  model.updateOne = async (where, updates = {}) => {
    const values = { ...updates, ...(updates.$set || {}) };
    delete values.$set;
    return model.update(values, { where: toWhere(model, where) });
  };
  model.findOneAndUpdate = async (where, updates = {}, options = {}) => {
    const doc = await findOneNative({ where: toWhere(model, where) });
    const changes = { ...updates, ...(updates.$set || {}) };
    delete changes.$set;
    delete changes.$inc;
    for (const [field, increment] of Object.entries(updates.$inc || {})) changes[field] = Number(doc?.[field] || 0) + Number(increment);
    if (!doc) return options.upsert ? model.create({ ...where, ...changes }) : null;
    if (options.new === false) {
      const before = doc.get({ plain: true });
      await doc.update(changes);
      return before;
    }
    await doc.update(changes);
    return doc;
  };
  model.distinct = async (field, where = {}) => [...new Set((await model.find(where).select(field)).map((row) => row[field]).filter((value) => value != null))];

  model.hiddenAttributes = options.hiddenAttributes || [];
  model.prototype.toJSON = function toJSON() {
    const value = this.get({ plain: true });
    for (const field of this.constructor.hiddenAttributes || []) delete value[field];
    for (const [field, alias] of Object.entries(this.constructor.populateAliases || {})) {
      if (Object.hasOwn(value, alias)) {
        value[field] = value[alias];
        delete value[alias];
      }
    }
    return value;
  };
  model.prototype.populate = async function populate(value) {
    for (const include of parsePopulate(this.constructor, value)) {
      const associated = await this[include.association.accessors.get]();
      const field = Object.entries(this.constructor.populateAliases || {}).find(([, alias]) => alias === include.association.as)?.[0] || include.association.as;
      this.setDataValue(field, associated);
    }
    return this;
  };
  return model;
}

function addAssociations(models) {
  const { Village, User, Citizen, DevelopmentPlan, Work, Grievance } = models;
  for (const model of Object.values(models)) {
    if (model !== Village && model.rawAttributes.villageId) {
      model.belongsTo(Village, { as: 'village', foreignKey: 'villageId', constraints: false });
    }
  }
  Work.belongsTo(User, { as: 'assignedToUser', foreignKey: 'assignedTo', constraints: false });
  Work.belongsTo(DevelopmentPlan, { as: 'developmentPlan', foreignKey: 'planId', constraints: false });
  Grievance.belongsTo(Citizen, { as: 'citizen', foreignKey: 'citizenId', constraints: false });
  Grievance.belongsTo(User, { as: 'assignedToUser', foreignKey: 'assignedTo', constraints: false });
  Work.populateAliases = { assignedTo: 'assignedToUser', planId: 'developmentPlan' };
  Grievance.populateAliases = { citizenId: 'citizen', assignedTo: 'assignedToUser' };
  return models;
}

module.exports = { DataTypes, Op, sequelize, defineModel, addAssociations, toWhere };