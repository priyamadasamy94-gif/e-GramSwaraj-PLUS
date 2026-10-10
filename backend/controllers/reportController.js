const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const reports = require('../services/reportService');
const stats = require('../services/statsService');

const fy = (q) => (typeof q.financialYear === 'string' && /^\d{4}-\d{2}$/.test(q.financialYear) ? q.financialYear : undefined);

exports.development = asyncHandler(async (req, res) => ok(res, await reports.development(req.villageId)));
exports.finance = asyncHandler(async (req, res) => ok(res, await reports.finance(req.villageId, fy(req.query))));
exports.assets = asyncHandler(async (req, res) => ok(res, await reports.assets(req.villageId)));
exports.grievances = asyncHandler(async (req, res) => ok(res, await reports.grievances(req.villageId)));
exports.publicReport = asyncHandler(async (req, res) => ok(res, await reports.publicReport(req.villageId)));
exports.financeSummary = asyncHandler(async (req, res) => ok(res, await stats.financeSummary(req.villageId, fy(req.query))));
exports.financialYears = asyncHandler(async (req, res) => ok(res, await stats.financialYears(req.villageId)));
exports.translations = asyncHandler(async (req, res) => ok(res, await reports.translationCoverage(req.villageId)));
