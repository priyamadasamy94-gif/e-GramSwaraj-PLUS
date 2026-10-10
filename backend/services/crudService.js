const { buildFilter, parsePagination, parseSort } = require('../utils/query');
const ApiError = require('../utils/ApiError');

/**
 * Generic, village-scoped data access used by every module.
 * The villageId is always injected server-side, so one village can never read or write another's data.
 */
function createCrudService(Model, cfg = {}) {
  const {
    searchFields = [], filterFields = [], dateField = 'createdAt',
    sortable = ['createdAt'], defaultSort = '-createdAt', populate = '',
  } = cfg;

  async function list(villageId, query = {}, { extraFilter = {}, select } = {}) {
    const filter = { ...buildFilter(query, { searchFields, filterFields, dateField }), ...extraFilter, villageId };
    const { page, limit, skip } = parsePagination(query);
    const sort = parseSort(query.sort, sortable, defaultSort);
    let q = Model.find(filter).sort(sort).skip(skip).limit(limit);
    if (populate) q = q.populate(populate);
    if (select) q = q.select(select);
    const [items, total] = await Promise.all([q, Model.countDocuments(filter)]);
    return { items, meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
  }

  async function getById(villageId, id, { extraFilter = {}, select } = {}) {
    let q = Model.findOne({ _id: id, villageId, ...extraFilter });
    if (populate) q = q.populate(populate);
    if (select) q = q.select(select);
    const doc = await q;
    if (!doc) throw ApiError.notFound(`${Model.modelName} not found`);
    return doc;
  }

  async function create(villageId, data) {
    const doc = new Model({ ...data, villageId });
    await doc.save();
    return populate ? doc.populate(populate) : doc;
  }

  async function update(villageId, id, data, { extraFilter = {} } = {}) {
    const doc = await Model.findOne({ _id: id, villageId, ...extraFilter });
    if (!doc) throw ApiError.notFound(`${Model.modelName} not found`);
    doc.set(data);
    await doc.save(); // runs validators + pre-save hooks
    return populate ? doc.populate(populate) : doc;
  }

  async function remove(villageId, id) {
    const doc = await Model.findOneAndDelete({ _id: id, villageId });
    if (!doc) throw ApiError.notFound(`${Model.modelName} not found`);
    return doc;
  }

  return { Model, list, getById, create, update, remove };
}

module.exports = { createCrudService };
