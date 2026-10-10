/**
 * Citizen Services Controller
 * Provides multilingual access to the Panchayat Service Catalog & Citizen Requests
 */
const M = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/response');
const { normalizeLanguage, localizeServices } = require('../services/translationService');
const ApiError = require('../utils/ApiError');

// List all citizen services with localization
exports.listServices = asyncHandler(async (req, res) => {
  const lang = req.query.language || req.headers['accept-language'] || req.user?.language || 'en';
  const services = await M.Service.find({
    villageId: req.villageId,
    status: 'ACTIVE',
  }).sort('name');

  const localized = await localizeServices(services, lang);
  ok(res, localized, 'Services list');
});

// Get a single service by ID or code
exports.getService = asyncHandler(async (req, res) => {
  const lang = req.query.language || req.headers['accept-language'] || req.user?.language || 'en';
  const service = await M.Service.findOne({
    _id: req.params.id,
    villageId: req.villageId,
  });
  if (!service) throw ApiError.notFound('Service not found');

  const localized = await localizeServices(service, lang);
  ok(res, localized);
});

// Submit a service request
exports.createServiceRequest = asyncHandler(async (req, res) => {
  const { serviceId, details, ward, address, priority = 'MEDIUM' } = req.body;
  if (!serviceId) throw ApiError.badRequest('serviceId is required');

  const srv = await M.Service.findOne({ _id: serviceId, villageId: req.villageId });
  if (!srv) throw ApiError.notFound('Service not found');

  const year = new Date().getFullYear();
  const cKey = `srv-req-${req.villageId}-${year}`;
  const seq = await M.Counter.next(cKey);
  const appNum = `SRV-${year}-${String(seq).padStart(4, '0')}`;

  const request = await M.ServiceRequest.create({
    villageId: req.villageId,
    applicationNumber: appNum,
    serviceId,
    citizenId: req.user._id,
    applicantName: req.user.name,
    applicantPhone: req.user.phone || '',
    applicantEmail: req.user.email,
    ward: ward || '',
    address: address || '',
    details: details || '',
    priority,
    status: 'SUBMITTED',
    slaDays: srv.processingTimeDays || 7,
    timeline: [
      {
        status: 'SUBMITTED',
        action: 'Application submitted online',
        byName: req.user.name,
        at: new Date(),
      },
    ],
  });

  const { NotificationService } = require('../services/notificationService');
  try {
    await NotificationService.notifyCitizen({
      user: req.user,
      eventType: 'APPLICATION_SUBMITTED',
      title: `Application Submitted: ${appNum}`,
      message: `Your application for ${srv.name} (${appNum}) has been submitted successfully.`,
      channels: ['whatsapp', 'email'],
    });
  } catch (err) {
    console.warn('[service] WhatsApp/Email notify failed safely:', err.message);
  }

  created(res, request, 'Service request submitted successfully');
});

// List citizen's service requests
exports.listMyServiceRequests = asyncHandler(async (req, res) => {
  const requests = await M.ServiceRequest.find({
    villageId: req.villageId,
    citizenId: req.user._id,
  }).sort('-createdAt');
  ok(res, requests, 'My service requests');
});
