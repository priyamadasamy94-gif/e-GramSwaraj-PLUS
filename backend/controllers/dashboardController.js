const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const stats = require('../services/statsService');

exports.admin = asyncHandler(async (req, res) => {
  const lang = req.query.language || req.headers['accept-language'] || req.user?.language || 'en';
  ok(res, await stats.adminDashboard(req.villageId, lang));
});
exports.citizen = asyncHandler(async (req, res) => {
  const lang = req.query.language || req.headers['accept-language'] || req.user?.language || 'en';
  ok(res, await stats.citizenDashboard(req.villageId, req.user._id, lang));
});
