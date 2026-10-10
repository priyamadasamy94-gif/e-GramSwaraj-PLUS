const { Village } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/response');
const { pick } = require('../utils/query');
const { activeVillage } = require('./authController');
const { localizeVillages } = require('../services/translationService');

const EDITABLE = ['name', 'panchayatName', 'block', 'taluk', 'district', 'state', 'pincode', 'population', 'households',
  'wards', 'area', 'latitude', 'longitude', 'locationIsApproximate', 'description', 'presidentName', 'secretaryName',
  'contact', 'facilities', 'dataNote'];

// Minimal identity for the login/landing screen (no auth).
exports.publicInfo = asyncHandler(async (req, res) => {
  const v = await activeVillage();
  const lang = req.query.language || req.headers['accept-language'] || 'en';
  const localized = await localizeVillages(v, lang);
  ok(res, pick(localized, ['name', 'villageCode', 'panchayatName', 'taluk', 'district', 'state', 'pincode', 'country']));
});

exports.current = asyncHandler(async (req, res) => {
  const v = await Village.findById(req.villageId);
  if (!v) throw ApiError.notFound('Village not found');
  const lang = req.query.language || req.headers['accept-language'] || req.user?.language || 'en';
  const localized = await localizeVillages(v, lang);
  ok(res, localized);
});

exports.updateCurrent = asyncHandler(async (req, res) => {
  const v = await Village.findById(req.villageId);
  if (!v) throw ApiError.notFound('Village not found');
  v.set(pick(req.body || {}, EDITABLE));
  await v.save();
  const lang = req.query.language || req.headers['accept-language'] || req.user?.language || 'en';
  const localized = await localizeVillages(v, lang);
  ok(res, localized, 'Village information updated successfully');
});

// Phase 2 groundwork: list villages (admin only). The UI does not expose a selector yet.
exports.list = asyncHandler(async (_req, res) => {
  ok(res, await Village.find().select('name villageCode taluk district state pincode status').sort('state district taluk name'));
});
