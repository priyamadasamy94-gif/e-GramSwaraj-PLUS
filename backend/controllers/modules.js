/**
 * Configuration for the "standard" CRUD modules. Each is a village-scoped service + controller.
 * Module-specific behaviour (notifications, budget recalculation, citizen visibility) lives in hooks here.
 */
const M = require('../models');
const { createCrudService } = require('../services/crudService');
const { makeCrudController } = require('./crudController');
const { notifyVillage } = require('../services/notificationService');
const { recalcBudget } = require('../services/budgetService');
const { publishedFilter } = require('../services/statsService');
const { localizeAnnouncements, localizeMeetings, localizeDevelopmentPlans, localizeAssets } = require('../services/translationService');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');

const isCitizen = (req) => req.user.role === 'CITIZEN';

// ---- Citizens ----
const citizenService = createCrudService(M.Citizen, {
  searchFields: ['name', 'phone', 'email', 'address'], filterFields: ['ward', 'status', 'gender'],
  sortable: ['name', 'ward', 'createdAt'], defaultSort: 'name',
});
const citizens = makeCrudController(citizenService, {
  label: 'Citizen', fields: ['name', 'phone', 'email', 'address', 'ward', 'gender', 'status'],
});

// ---- Development plans ----
const planService = createCrudService(M.DevelopmentPlan, {
  searchFields: ['title', 'description', 'ward'], filterFields: ['category', 'priority', 'status', 'financialYear'],
  dateField: 'startDate', sortable: ['title', 'estimatedCost', 'priority', 'startDate', 'targetDate', 'createdAt', 'progress'],
  populate: { path: 'createdBy', select: 'name' },
});
const plans = makeCrudController(planService, {
  label: 'Development plan',
  fields: ['title', 'description', 'category', 'priority', 'estimatedCost', 'status', 'progress', 'financialYear', 'ward', 'startDate', 'targetDate'],
  transform: (items, req) => localizeDevelopmentPlans(items, req.query.language || req.headers['accept-language'] || req.user?.language || 'en'),
});

// ---- Assets ----
const assetService = createCrudService(M.Asset, {
  searchFields: ['name', 'assetCode', 'location', 'ownerDepartment'], filterFields: ['type', 'condition', 'status', 'ward', 'planYear', 'category', 'subCategory'],
  dateField: 'maintenanceDate', sortable: ['name', 'type', 'condition', 'maintenanceDate', 'estimatedValue', 'createdAt'], defaultSort: 'name',
});
const ASSET_FIELDS = ['name', 'assetCode', 'type', 'location', 'ward', 'latitude', 'longitude', 'condition', 'ownerDepartment',
  'installationDate', 'estimatedValue', 'maintenanceDate', 'maintenanceIntervalDays', 'status', 'notes'];
const assets = makeCrudController(assetService, {
  label: 'Asset', fields: ASSET_FIELDS,
  select: (req) => (isCitizen(req) ? 'name assetCode planYear type category subCategory location ward condition status estimatedValue expenditure latitude longitude' : undefined),
  transform: (items, req) => localizeAssets(items, req.query.language || req.headers['accept-language'] || req.user?.language || 'en'),
});

// ---- Budgets ----
const budgetService = createCrudService(M.Budget, {
  searchFields: ['category', 'source'], filterFields: ['financialYear', 'category'],
  sortable: ['category', 'allocatedAmount', 'utilizedAmount', 'financialYear', 'createdAt'], defaultSort: 'category',
});
const budgets = makeCrudController(budgetService, {
  label: 'Budget allocation', fields: ['financialYear', 'category', 'allocatedAmount', 'source', 'notes'],
  afterCreate: (doc) => recalcBudget(doc.villageId, doc.financialYear, doc.category),
  afterUpdate: (doc) => recalcBudget(doc.villageId, doc.financialYear, doc.category),
});

// ---- Transactions ----
const txService = createCrudService(M.FinancialTransaction, {
  searchFields: ['description', 'referenceNumber', 'category'], filterFields: ['type', 'category', 'status', 'financialYear'],
  dateField: 'date', sortable: ['date', 'amount', 'category', 'type', 'createdAt'], defaultSort: '-date',
  populate: { path: 'createdBy', select: 'name' },
});
const recalcTx = async (doc) => recalcBudget(doc.villageId, doc.financialYear, doc.category);
const transactions = makeCrudController(txService, {
  label: 'Transaction', fields: ['type', 'category', 'description', 'amount', 'referenceNumber', 'date', 'status', 'workId'],
  afterCreate: recalcTx, afterUpdate: recalcTx, afterDelete: recalcTx,
});

// ---- Meetings ----
const meetingService = createCrudService(M.Meeting, {
  searchFields: ['title', 'location', 'minutes'], filterFields: ['type', 'status'],
  dateField: 'date', sortable: ['date', 'title', 'type', 'createdAt'], defaultSort: '-date',
});
const meetings = makeCrudController(meetingService, {
  label: 'Meeting', fields: ['title', 'type', 'date', 'location', 'agenda', 'minutes', 'decisions', 'attendance', 'isPublic', 'status'],
  scope: (req) => (isCitizen(req) ? { isPublic: true } : {}),
  select: (req) => (isCitizen(req) ? '-createdBy -reminderSent' : undefined),
  transform: (items, req) => localizeMeetings(items, req.query.language || req.headers['accept-language'] || req.user?.language || 'en'),
  afterCreate: async (doc) => {
    if (doc.status !== 'SCHEDULED' || !doc.isPublic) return;
    await notifyVillage(doc.villageId, {
      title: `Meeting scheduled: ${doc.title}`,
      message: `${doc.type.replace(/_/g, ' ')} on ${doc.date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })} at ${doc.location || 'Panchayat Office'}.`,
      type: 'MEETING', link: '/meetings',
    });
  },
});

// ---- Announcements ----
const annService = createCrudService(M.Announcement, {
  searchFields: ['title', 'description'], filterFields: ['category', 'status'],
  dateField: 'publishDate', sortable: ['publishDate', 'title', 'createdAt'], defaultSort: '-publishDate',
  populate: { path: 'createdBy', select: 'name' },
});
async function announceIfPublished(doc) {
  if (doc.status !== 'PUBLISHED' || doc.notified || doc.publishDate > new Date()) return;
  await notifyVillage(doc.villageId, {
    title: doc.category === 'EMERGENCY' ? `EMERGENCY: ${doc.title}` : `New announcement: ${doc.title}`,
    message: doc.description.slice(0, 180), type: 'ANNOUNCEMENT', link: '/announcements',
  });
  await M.Announcement.updateOne({ _id: doc._id }, { notified: true });
}
const baseAnnouncements = makeCrudController(annService, {
  label: 'Announcement', fields: ['title', 'description', 'category', 'publishDate', 'expiryDate', 'status', 'pinned'],
  scope: (req) => {
    if (!isCitizen(req)) return {};
    const { villageId, ...rest } = publishedFilter(req.villageId); // eslint-disable-line no-unused-vars
    return rest;
  },
  afterCreate: announceIfPublished, afterUpdate: announceIfPublished,
});

const announcements = {
  ...baseAnnouncements,
  list: asyncHandler(async (req, res) => {
    const lang = req.query.language || req.headers['accept-language'] || req.user?.language || 'en';
    const scope = isCitizen(req) ? publishedFilter(req.villageId) : {};
    const { villageId, ...extraFilter } = scope;
    const { items, meta } = await annService.list(req.villageId, req.query, { extraFilter });
    const localized = await localizeAnnouncements(items, lang);
    ok(res, localized, 'Announcement list', 200, meta);
  }),
  get: asyncHandler(async (req, res) => {
    const lang = req.query.language || req.headers['accept-language'] || req.user?.language || 'en';
    const scope = isCitizen(req) ? publishedFilter(req.villageId) : {};
    const { villageId, ...extraFilter } = scope;
    const doc = await annService.getById(req.villageId, req.params.id, { extraFilter });
    const localized = await localizeAnnouncements(doc, lang);
    ok(res, localized);
  }),
};

module.exports = {
  citizens, plans, assets, budgets, transactions, meetings, announcements,
  services: { citizenService, planService, assetService, budgetService, txService, meetingService, annService },
};
