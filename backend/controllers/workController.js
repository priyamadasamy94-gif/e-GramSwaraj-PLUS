const M = require('../models');
const { createCrudService } = require('../services/crudService');
const { makeCrudController } = require('./crudController');
const { notifyUser, notifyVillage } = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/response');
const { MANAGERS, WORK_STATUSES } = require('../config/constants');
const { localizeWorks } = require('../services/translationService');

const workService = createCrudService(M.Work, {
  searchFields: ['name', 'description', 'location', 'contractor', 'scheme'],
  filterFields: ['status', 'category', 'priority', 'location', 'assignedTo', 'planId'],
  dateField: 'startDate',
  sortable: ['name', 'progress', 'estimatedCost', 'startDate', 'expectedCompletionDate', 'createdAt', 'updatedAt'],
  defaultSort: '-updatedAt',
  populate: [{ path: 'assignedTo', select: 'name role' }, { path: 'planId', select: 'title' }],
});

const PUBLIC_FIELDS = 'name description category location latitude longitude status progress estimatedCost approvedAmount startDate expectedCompletionDate actualCompletionDate scheme';
const isCitizen = (req) => req.user.role === 'CITIZEN';

async function notifyWorkChange(doc, req, prevStatus) {
  const who = req.user.name;
  const targets = await M.User.find({ villageId: doc.villageId, role: { $in: MANAGERS }, status: 'ACTIVE', _id: { $ne: req.user._id } }).select('_id');
  const ids = new Set(targets.map((t) => String(t._id)));
  if (doc.assignedTo) ids.add(String(doc.assignedTo._id || doc.assignedTo));
  ids.delete(String(req.user._id));
  for (const id of ids) {
    await notifyUser(doc.villageId, id, {
      title: `Work updated: ${doc.name}`, message: `${who} set progress to ${doc.progress}% (${doc.status.replace('_', ' ')}).`,
      type: 'WORK', link: '/works',
    });
  }
  if (doc.status === 'COMPLETED' && prevStatus !== 'COMPLETED') {
    await notifyVillage(doc.villageId, {
      title: `Development work completed: ${doc.name}`, message: `${doc.location ? `${doc.location}. ` : ''}Thank you for your patience.`,
      type: 'WORK', link: '/works', dedupeKey: `work-complete-${doc._id}`,
    }, ['CITIZEN']);
  }
}

const base = makeCrudController(workService, {
  label: 'Work',
  fields: ['name', 'description', 'category', 'location', 'latitude', 'longitude', 'planId', 'scheme', 'estimatedCost',
    'approvedAmount', 'spentAmount', 'contractor', 'startDate', 'expectedCompletionDate', 'actualCompletionDate',
    'status', 'progress', 'assignedTo'],
  scope: (req) => (isCitizen(req) ? { status: { $in: ['APPROVED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'] } } : {}),
  select: (req) => (isCitizen(req) ? PUBLIC_FIELDS : undefined),
  transform: (items, req) => localizeWorks(items, req.query.language || req.headers['accept-language'] || req.user?.language || 'en'),
  afterUpdate: (doc, req) => notifyWorkChange(doc, req),
});

/** Progress update: managers can update any work, STAFF only works assigned to them. */
const updateProgress = asyncHandler(async (req, res) => {
  const work = await M.Work.findOne({ _id: req.params.id, villageId: req.villageId });
  if (!work) throw ApiError.notFound('Work not found');
  if (req.user.role === 'STAFF' && String(work.assignedTo) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only update works assigned to you');
  }
  const { progress, status, note, spentAmount } = req.body || {};
  const prevStatus = work.status;
  if (progress !== undefined) {
    const p = Number(progress);
    if (!Number.isFinite(p) || p < 0 || p > 100) throw ApiError.badRequest('Progress must be between 0 and 100');
    work.progress = Math.round(p);
    if (p > 0 && ['PLANNED', 'APPROVED'].includes(work.status) && !status) work.status = 'IN_PROGRESS';
  }
  if (status !== undefined) {
    if (!WORK_STATUSES.includes(status)) throw ApiError.badRequest('Invalid status');
    work.status = status;
  }
  if (spentAmount !== undefined) {
    const s = Number(spentAmount);
    if (!Number.isFinite(s) || s < 0) throw ApiError.badRequest('Spent amount must be a positive number');
    work.spentAmount = s;
  }
  work.updates.push({ progress: work.progress, status: work.status, note: typeof note === 'string' ? note.slice(0, 500) : undefined, by: req.user._id, byName: req.user.name });
  await work.save();
  await work.populate([{ path: 'assignedTo', select: 'name role' }, { path: 'planId', select: 'title' }]);
  await notifyWorkChange(work, req, prevStatus);
  ok(res, work, 'Work progress updated');
});

module.exports = { ...base, updateProgress, workService };
