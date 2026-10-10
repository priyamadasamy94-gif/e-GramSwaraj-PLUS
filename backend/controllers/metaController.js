const C = require('../config/constants');
const { ok } = require('../utils/response');
const { dbStatus } = require('../config/db');
const { financialYearOf } = require('../utils/query');

// Single source of truth for dropdown options used by the frontend forms.
exports.options = (_req, res) => ok(res, {
  roles: C.ALL_ROLES, planCategories: C.PLAN_CATEGORIES, priorities: C.PRIORITIES, planStatuses: C.PLAN_STATUSES,
  workStatuses: C.WORK_STATUSES, assetTypes: C.ASSET_TYPES, assetConditions: C.ASSET_CONDITIONS, assetStatuses: C.ASSET_STATUSES,
  transactionTypes: C.TRANSACTION_TYPES, transactionStatuses: C.TRANSACTION_STATUSES,
  financeCategories: C.FINANCE_CATEGORIES, incomeCategories: C.INCOME_CATEGORIES,
  meetingTypes: C.MEETING_TYPES, meetingStatuses: C.MEETING_STATUSES,
  grievanceCategories: C.GRIEVANCE_CATEGORIES, grievanceStatuses: C.GRIEVANCE_STATUSES,
  announcementCategories: C.ANNOUNCEMENT_CATEGORIES, announcementStatuses: C.ANNOUNCEMENT_STATUSES,
  userStatuses: C.USER_STATUSES, revenueVillages: C.REVENUE_VILLAGES, currentFinancialYear: financialYearOf(),
});

exports.health = (_req, res) => res.json({ success: true, data: { api: 'up', database: dbStatus(), time: new Date().toISOString() }, message: 'OK' });
