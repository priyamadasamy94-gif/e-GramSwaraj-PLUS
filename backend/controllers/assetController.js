const M = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/response');
const { maintenanceDueFilter } = require('../services/statsService');
const { ASSET_CONDITIONS } = require('../config/constants');

exports.maintenanceDue = asyncHandler(async (req, res) => {
  const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 30));
  const items = await M.Asset.find(maintenanceDueFilter(req.villageId, days)).sort('maintenanceDate')
    .select('name type location condition maintenanceDate status');
  const now = Date.now();
  ok(res, items.map((a) => ({ ...a.toJSON(), overdue: a.maintenanceDate.getTime() < now,
    daysLeft: Math.ceil((a.maintenanceDate.getTime() - now) / 86400000) })));
});

/** Record a maintenance activity and schedule the next one. */
exports.logMaintenance = asyncHandler(async (req, res) => {
  const asset = await M.Asset.findOne({ _id: req.params.id, villageId: req.villageId });
  if (!asset) throw ApiError.notFound('Asset not found');
  const { description, cost, performedBy, date, condition } = req.body || {};
  if (typeof description !== 'string' || !description.trim()) throw ApiError.badRequest('Description is required');
  const when = date ? new Date(date) : new Date();
  if (isNaN(when)) throw ApiError.badRequest('Invalid date');
  asset.maintenanceLog.push({ date: when, description: description.trim(), cost: Number(cost) || 0, performedBy });
  if (condition) {
    if (!ASSET_CONDITIONS.includes(condition)) throw ApiError.badRequest('Invalid condition');
    asset.condition = condition;
  }
  if (asset.maintenanceIntervalDays > 0) asset.maintenanceDate = new Date(when.getTime() + asset.maintenanceIntervalDays * 86400000);
  if (asset.status === 'UNDER_MAINTENANCE') asset.status = 'ACTIVE';
  await asset.save();
  ok(res, asset, 'Maintenance recorded');
});

/** Update ONLY the geographic location (latitude/longitude) for an asset. */
exports.updateLocation = asyncHandler(async (req, res) => {
  const asset = await M.Asset.findOne({ _id: req.params.id, villageId: req.villageId });
  if (!asset) throw ApiError.notFound('Asset not found');

  const { latitude, longitude } = req.body || {};

  if (latitude === undefined || longitude === undefined) {
    throw ApiError.badRequest('Both latitude and longitude are required');
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw ApiError.badRequest('Latitude must be a valid number between -90 and 90');
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw ApiError.badRequest('Longitude must be a valid number between -180 and 180');
  }

  asset.latitude = lat;
  asset.longitude = lng;
  await asset.save();

  ok(res, { _id: asset._id, latitude: asset.latitude, longitude: asset.longitude }, 'Asset location saved');
});
