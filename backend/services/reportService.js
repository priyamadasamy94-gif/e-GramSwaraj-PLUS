const M = require('../models');
const { countBy, toMap, financeSummary, maintenanceDueFilter } = require('./statsService');

async function development(villageId) {
  const [byStatus, byCategory, works, plansByStatus] = await Promise.all([
    countBy(M.Work, villageId, 'status'),
    countBy(M.Work, villageId, 'category'),
    M.Work.find({ villageId }).sort('category name')
      .select('name category location status progress estimatedCost approvedAmount spentAmount contractor startDate expectedCompletionDate'),
    countBy(M.DevelopmentPlan, villageId, 'status'),
  ]);
  const s = toMap(byStatus);
  const sum = (k) => works.reduce((a, w) => a + (w[k] || 0), 0);
  return {
    summary: {
      totalProjects: works.length,
      completed: s.COMPLETED || 0,
      inProgress: s.IN_PROGRESS || 0,
      pending: (s.PLANNED || 0) + (s.APPROVED || 0),
      onHold: s.ON_HOLD || 0,
      cancelled: s.CANCELLED || 0,
      totalEstimated: sum('estimatedCost'),
      totalApproved: sum('approvedAmount'),
      totalSpent: sum('spentAmount'),
      averageProgress: works.length ? Math.round(sum('progress') / works.length) : 0,
    },
    byStatus: byStatus.map((r) => ({ name: r._id, value: r.count })),
    byCategory: byCategory.map((r) => ({ name: r._id, value: r.count })),
    plansByStatus: plansByStatus.map((r) => ({ name: r._id, value: r.count })),
    rows: works,
  };
}

async function finance(villageId, fy) {
  const summary = await financeSummary(villageId, fy);
  const rows = await M.FinancialTransaction.find({ villageId, financialYear: summary.financialYear })
    .sort('-date').select('date type category description amount referenceNumber status');
  return { summary, rows };
}

async function assets(villageId) {
  const [byCondition, byType, rows, due] = await Promise.all([
    countBy(M.Asset, villageId, 'condition'),
    countBy(M.Asset, villageId, 'type'),
    M.Asset.find({ villageId }).sort('type name')
      .select('name assetCode type location condition status estimatedValue maintenanceDate installationDate'),
    M.Asset.countDocuments(maintenanceDueFilter(villageId)),
  ]);
  const c = toMap(byCondition);
  return {
    summary: {
      totalAssets: rows.length,
      good: c.GOOD || 0, fair: c.FAIR || 0, poor: c.POOR || 0, critical: c.CRITICAL || 0,
      maintenanceRequired: due,
      totalValue: rows.reduce((a, r) => a + (r.estimatedValue || 0), 0),
    },
    byCondition: byCondition.map((r) => ({ name: r._id, value: r.count })),
    byType: byType.map((r) => ({ name: r._id, value: r.count })),
    rows,
  };
}

async function grievances(villageId) {
  const [byStatus, byCategory, rows] = await Promise.all([
    countBy(M.Grievance, villageId, 'status'),
    countBy(M.Grievance, villageId, 'category'),
    M.Grievance.find({ villageId }).sort('-createdAt')
      .select('referenceNumber category subject priority status ward createdAt resolvedAt')
      .populate('assignedTo', 'name'),
  ]);
  const s = toMap(byStatus);
  const resolved = rows.filter((r) => r.resolvedAt);
  const avgDays = resolved.length
    ? Math.round((resolved.reduce((a, r) => a + (r.resolvedAt - r.createdAt), 0) / resolved.length / 86400000) * 10) / 10
    : 0;
  return {
    summary: {
      total: rows.length,
      pending: (s.SUBMITTED || 0) + (s.ACKNOWLEDGED || 0),
      inProgress: s.IN_PROGRESS || 0,
      resolved: s.RESOLVED || 0,
      rejected: s.REJECTED || 0,
      averageResolutionDays: avgDays,
    },
    byStatus: byStatus.map((r) => ({ name: r._id, value: r.count })),
    byCategory: byCategory.map((r) => ({ name: r._id, value: r.count })),
    rows,
  };
}

/** Citizen-safe summary: no transactions, no personal data. */
async function publicReport(villageId) {
  const [dev, grv, ast] = await Promise.all([development(villageId), grievances(villageId), assets(villageId)]);
  return {
    development: { summary: dev.summary, byStatus: dev.byStatus, byCategory: dev.byCategory },
    grievances: { summary: grv.summary, byCategory: grv.byCategory },
    assets: { summary: { totalAssets: ast.summary.totalAssets, good: ast.summary.good, fair: ast.summary.fair, poor: ast.summary.poor, critical: ast.summary.critical }, byType: ast.byType },
  };
}

async function translationCoverage(villageId) {
  const entries = await M.TranslationCache.findAll({ attributes: ['targetLanguage'], raw: true });
  const byLanguage = Object.fromEntries(['hi', 'ta', 'te', 'kn', 'ml', 'mr', 'bn'].map((language) => [language, 0]));
  for (const entry of entries) {
    if (Object.hasOwn(byLanguage, entry.targetLanguage)) byLanguage[entry.targetLanguage]++;
  }
  return { totalCached: entries.length, byLanguage };
}

module.exports = { development, finance, assets, grievances, publicReport, translationCoverage };
