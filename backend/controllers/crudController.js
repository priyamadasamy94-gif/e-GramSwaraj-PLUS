const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/response');
const { pick } = require('../utils/query');
const ApiError = require('../utils/ApiError');

/**
 * Builds standard list/get/create/update/remove handlers for a module.
 * opts.fields            – whitelist of client-writable fields (villageId/createdBy are never writable)
 * opts.scope(req)        – extra filter per user (e.g. citizens only see published items)
 * opts.select(req)       – projection per user (hide admin-only fields)
 * opts.label             – human label for messages
 * opts.afterCreate/afterUpdate/afterDelete(doc, req) – side effects (notifications, recalcs)
 */
function makeCrudController(service, opts = {}) {
  const label = opts.label || service.Model.modelName;
  const scope = (req) => (opts.scope ? opts.scope(req) : {});
  const select = (req) => (opts.select ? opts.select(req) : undefined);
  const clean = (body) => {
    if (!body || typeof body !== 'object') throw ApiError.badRequest('Request body is required');
    return opts.fields ? pick(body, opts.fields) : body;
  };

  return {
    list: asyncHandler(async (req, res) => {
      const { items, meta } = await service.list(req.villageId, req.query, { extraFilter: scope(req), select: select(req) });
      const data = opts.transform ? await opts.transform(items, req) : items;
      ok(res, data, `${label} list`, 200, meta);
    }),
    get: asyncHandler(async (req, res) => {
      const doc = await service.getById(req.villageId, req.params.id, { extraFilter: scope(req), select: select(req) });
      const data = opts.transform ? await opts.transform(doc, req) : doc;
      ok(res, data);
    }),
    create: asyncHandler(async (req, res) => {
      const data = clean(req.body);
      if (service.Model.schema.path('createdBy')) data.createdBy = req.user._id;
      const doc = await service.create(req.villageId, data);
      if (opts.afterCreate) await opts.afterCreate(doc, req);
      created(res, doc, `${label} created successfully`);
    }),
    update: asyncHandler(async (req, res) => {
      const doc = await service.update(req.villageId, req.params.id, clean(req.body));
      if (opts.afterUpdate) await opts.afterUpdate(doc, req);
      ok(res, doc, `${label} updated successfully`);
    }),
    remove: asyncHandler(async (req, res) => {
      const doc = await service.remove(req.villageId, req.params.id);
      if (opts.afterDelete) await opts.afterDelete(doc, req);
      ok(res, { _id: doc._id }, `${label} deleted successfully`);
    }),
  };
}

module.exports = { makeCrudController };
