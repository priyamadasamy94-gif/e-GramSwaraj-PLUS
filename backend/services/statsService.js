const M = require('../models');
const { sequelize, toWhere } = require('../models/_common');
const { fn, col, literal } = require('sequelize');
const { financialYearOf } = require('../utils/query');
const { localizeAnnouncements } = require('./translationService');

/** Returns [{ _id: value, count }] grouped by a field, scoped to a village. */
async function countBy(Model, villageId, field, match = {}) {
  const rows = await Model._findAllNative({
    attributes: [[col(field), '_id'], [fn('COUNT', col('_id')), 'count']],
    where: toWhere(Model, { villageId, ...match }),
    group: [field],
    order: [[literal('count'), 'DESC']],
  });
  return rows.map((row) => {
    const value = row.get({ plain: true });
    return { ...value, count: Number(value.count) };
  });
}

const toMap = (rows) => Object.fromEntries(rows.map((r) => [r._id ?? 'UNSPECIFIED', r.count]));

async function sumBy(Model, villageId, field, match = {}, groupField = null) {
  const attributes = [
    [groupField ? col(groupField) : literal('NULL'), '_id'],
    [fn('SUM', col(field)), 'total'],
    [fn('COUNT', col('_id')), 'count'],
  ];
  const rows = await Model._findAllNative({
    attributes,
    where: toWhere(Model, { villageId, ...match }),
    ...(groupField ? { group: [groupField] } : {}),
  });
  return rows.map((row) => {
    const value = row.get({ plain: true });
    return { ...value, total: Number(value.total || 0), count: Number(value.count) };
  });
}

async function financeSummary(villageId, financialYear) {
  const fy = financialYear || financialYearOf();
  const [budgets, txByType, expenseByCat, incomeByCat] = await Promise.all([
    M.Budget.find({ villageId, financialYear: fy }).sort('category'),
    sumBy(M.FinancialTransaction, villageId, 'amount', { financialYear: fy, status: 'COMPLETED' }, 'type'),
    sumBy(M.FinancialTransaction, villageId, 'amount', { financialYear: fy, status: 'COMPLETED', type: 'EXPENSE' }, 'category'),
    sumBy(M.FinancialTransaction, villageId, 'amount', { financialYear: fy, status: 'COMPLETED', type: 'INCOME' }, 'category'),
  ]);
  const totalAllocation = budgets.reduce((s, b) => s + b.allocatedAmount, 0);
  const utilized = budgets.reduce((s, b) => s + b.utilizedAmount, 0);
  const t = Object.fromEntries(txByType.map((r) => [r._id, r.total]));
  return {
    financialYear: fy,
    totalAllocation,
    utilizedBudget: utilized,
    remainingBudget: totalAllocation - utilized,
    utilizationPercent: totalAllocation ? Math.round((utilized / totalAllocation) * 1000) / 10 : 0,
    totalIncome: t.INCOME || 0,
    totalExpenses: t.EXPENSE || 0,
    balance: (t.INCOME || 0) - (t.EXPENSE || 0),
    budgets: budgets.map((b) => ({
      category: b.category, allocated: b.allocatedAmount, utilized: b.utilizedAmount, remaining: b.remainingAmount,
    })),
    expenseByCategory: expenseByCat.map((r) => ({ category: r._id, amount: r.total })),
    incomeByCategory: incomeByCat.map((r) => ({ category: r._id, amount: r.total })),
  };
}

async function financialYears(villageId) {
  const [a, b] = await Promise.all([
    M.Budget.distinct('financialYear', { villageId }),
    M.FinancialTransaction.distinct('financialYear', { villageId }),
  ]);
  const set = new Set([...a, ...b, financialYearOf()]);
  return [...set].sort().reverse();
}

function maintenanceDueFilter(villageId, days = 30) {
  const horizon = new Date(Date.now() + days * 86400000);
  return { villageId, status: { $ne: 'DECOMMISSIONED' }, maintenanceDate: { $ne: null, $lte: horizon } };
}

async function adminDashboard(villageId, lang = 'en') {
  const now = new Date();
  const [
    worksByStatus, worksByCategory, assetsByCondition, grievancesByStatus, plansByCategory,
    upcomingMeetings, upcomingCount, activeAnnouncements, announcementCount, finance,
    maintenanceDue, recentGrievances, recentWorks, citizens,
  ] = await Promise.all([
    countBy(M.Work, villageId, 'status'),
    countBy(M.Work, villageId, 'category'),
    countBy(M.Asset, villageId, 'condition'),
    countBy(M.Grievance, villageId, 'status'),
    countBy(M.DevelopmentPlan, villageId, 'category'),
    M.Meeting.find({ villageId, date: { $gte: now }, status: 'SCHEDULED' }).sort('date').limit(4),
    M.Meeting.countDocuments({ villageId, date: { $gte: now }, status: 'SCHEDULED' }),
    M.Announcement.find(publishedFilter(villageId)).sort('-pinned -publishDate').limit(4),
    M.Announcement.countDocuments(publishedFilter(villageId)),
    financeSummary(villageId),
    M.Asset.countDocuments(maintenanceDueFilter(villageId)),
    M.Grievance.find({ villageId }).sort('-createdAt').limit(5).populate('citizenId', 'name ward'),
    M.Work.find({ villageId, status: 'IN_PROGRESS' }).sort('-updatedAt').limit(5),
    M.Citizen.countDocuments({ villageId }),
  ]);
  const ws = toMap(worksByStatus);
  const gs = toMap(grievancesByStatus);
  return {
    cards: {
      totalWorks: worksByStatus.reduce((s, r) => s + r.count, 0),
      activeWorks: ws.IN_PROGRESS || 0,
      completedWorks: ws.COMPLETED || 0,
      totalAssets: assetsByCondition.reduce((s, r) => s + r.count, 0),
      pendingGrievances: (gs.SUBMITTED || 0) + (gs.ACKNOWLEDGED || 0) + (gs.IN_PROGRESS || 0),
      resolvedGrievances: gs.RESOLVED || 0,
      totalBudget: finance.totalAllocation,
      budgetUtilized: finance.utilizedBudget,
      upcomingMeetings: upcomingCount,
      announcements: announcementCount,
      maintenanceDue,
      citizens,
    },
    charts: {
      workStatus: worksByStatus.map((r) => ({ name: r._id, value: r.count })),
      workCategories: worksByCategory.map((r) => ({ name: r._id, value: r.count })),
      assetCondition: assetsByCondition.map((r) => ({ name: r._id, value: r.count })),
      grievanceStatus: grievancesByStatus.map((r) => ({ name: r._id, value: r.count })),
      planCategories: plansByCategory.map((r) => ({ name: r._id, value: r.count })),
      budget: finance.budgets,
    },
    finance,
    upcomingMeetings,
    latestAnnouncements: await localizeAnnouncements(activeAnnouncements, lang),
    recentGrievances,
    activeWorks: recentWorks,
  };
}

function publishedFilter(villageId) {
  const now = new Date();
  return {
    villageId, status: 'PUBLISHED', publishDate: { $lte: now },
    $or: [{ expiryDate: null }, { expiryDate: { $exists: false } }, { expiryDate: { $gte: now } }],
  };
}

async function citizenDashboard(villageId, userId, lang = 'en') {
  const now = new Date();
  const [rawAnnouncements, works, meetings, assets, myGrievances, worksByStatus] = await Promise.all([
    M.Announcement.find(publishedFilter(villageId)).sort('-pinned -publishDate').limit(6),
    M.Work.find({ villageId, status: { $in: ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] } })
      .sort('-updatedAt').limit(6).select('name category location status progress estimatedCost startDate expectedCompletionDate'),
    M.Meeting.find({ villageId, isPublic: true, date: { $gte: now }, status: 'SCHEDULED' }).sort('date').limit(4)
      .select('title type date location agenda status'),
    countBy(M.Asset, villageId, 'type'),
    M.Grievance.find({ villageId, submittedBy: userId }).sort('-createdAt').limit(5)
      .select('referenceNumber subject category status createdAt resolvedAt'),
    countBy(M.Work, villageId, 'status'),
  ]);
  const announcements = await localizeAnnouncements(rawAnnouncements, lang);
  const ws = toMap(worksByStatus);
  return {
    announcements, works, meetings,
    publicAssets: assets.map((r) => ({ type: r._id, count: r.count })),
    myGrievances,
    counts: {
      worksInProgress: ws.IN_PROGRESS || 0,
      worksCompleted: ws.COMPLETED || 0,
      upcomingMeetings: meetings.length,
      myOpenGrievances: myGrievances.filter((g) => !['RESOLVED', 'REJECTED'].includes(g.status)).length,
    },
  };
}

module.exports = { countBy, toMap, sumBy, financeSummary, financialYears, adminDashboard, citizenDashboard, publishedFilter, maintenanceDueFilter };
