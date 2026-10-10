const M = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/response');
const { buildFilter, parsePagination, parseSort, pick } = require('../utils/query');
const { notifyUser, notifyVillage, NotificationService } = require('../services/notificationService');
const { MANAGERS, GRIEVANCE_STATUSES, OFFICIALS } = require('../config/constants');

const POPULATE = [
  { path: 'citizenId', select: 'name phone ward address' },
  { path: 'assignedTo', select: 'name role designation' },
];

// Allowed workflow transitions.
const TRANSITIONS = {
  SUBMITTED: ['ACKNOWLEDGED', 'IN_PROGRESS', 'REJECTED'],
  ACKNOWLEDGED: ['IN_PROGRESS', 'RESOLVED', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED', 'REJECTED', 'ACKNOWLEDGED'],
  RESOLVED: ['IN_PROGRESS'], // reopen
  REJECTED: ['ACKNOWLEDGED'], // reopen
};

function scopeFor(req) {
  if (req.user.role === 'CITIZEN') return { submittedBy: req.user._id };
  if (req.user.role === 'STAFF') return { assignedTo: req.user._id };
  return {};
}

async function nextReference(villageId) {
  const village = await M.Village.findById(villageId).select('villageCode');
  const year = new Date().getFullYear();
  const key = `grievance-${villageId}-${year}`;
  const seq = await M.Counter.next(key);
  return `${village.villageCode}-GRV-${year}-${String(seq).padStart(4, '0')}`;
}

async function notifyCitizen(g, title, message, eventType = 'COMPLAINT_STATUS_UPDATED') {
  if (g.submittedBy) await notifyUser(g.villageId, g.submittedBy, { title, message, type: 'GRIEVANCE', link: '/grievances/track' });
  try {
    const citizen = g.citizenId ? await M.Citizen.findById(g.citizenId) : null;
    const targetUser = g.submittedBy ? await M.User.findById(g.submittedBy) : null;
    const phone = targetUser?.phone || citizen?.phone;
    const email = targetUser?.email || citizen?.email;
    if (phone || email) {
      await NotificationService.notifyCitizen({
        user: targetUser,
        citizen: citizen || { villageId: g.villageId, phone, email },
        eventType,
        title,
        message,
        channels: ['whatsapp', 'email'],
      });
    }
  } catch (err) {
    console.warn('[grievance] WhatsApp/Email notify failed safely:', err.message);
  }
}

exports.list = asyncHandler(async (req, res) => {
  const filter = {
    ...buildFilter(req.query, {
      searchFields: ['referenceNumber', 'subject', 'description', 'location'],
      filterFields: ['status', 'category', 'priority', 'ward', 'location', 'assignedTo'],
      dateField: 'createdAt',
    }),
    ...scopeFor(req),
    villageId: req.villageId,
  };
  if (req.query.open === 'true') filter.status = { $in: ['SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS'] };
  const { page, limit, skip } = parsePagination(req.query);
  const sort = parseSort(req.query.sort, ['createdAt', 'priority', 'status', 'updatedAt'], '-createdAt');
  const [items, total] = await Promise.all([
    M.Grievance.find(filter).sort(sort).skip(skip).limit(limit).populate(POPULATE).select('-history'),
    M.Grievance.countDocuments(filter),
  ]);
  ok(res, items, 'Grievance list', 200, { page, limit, total, pages: Math.ceil(total / limit) || 1 });
});

exports.get = asyncHandler(async (req, res) => {
  const g = await M.Grievance.findOne({ _id: req.params.id, villageId: req.villageId, ...scopeFor(req) }).populate(POPULATE);
  if (!g) throw ApiError.notFound('Grievance not found');
  ok(res, g);
});

/** Track by reference number (any signed-in user of the village; citizens see a limited public view unless it is theirs). */
exports.track = asyncHandler(async (req, res) => {
  const ref = String(req.params.ref || '').toUpperCase().trim();
  const g = await M.Grievance.findOne({ referenceNumber: ref, villageId: req.villageId }).populate('assignedTo', 'name designation');
  if (!g) throw ApiError.notFound('No grievance found with that reference number');
  const mine = String(g.submittedBy) === String(req.user._id);
  if (req.user.role === 'CITIZEN' && !mine) {
    return ok(res, pick(g.toJSON(), ['referenceNumber', 'category', 'subject', 'status', 'createdAt', 'resolvedAt']));
  }
  ok(res, g);
});

exports.create = asyncHandler(async (req, res) => {
  const b = req.body || {};
  let citizenId;
  if (req.user.role === 'CITIZEN') {
    let citizen = await M.Citizen.findOne({ userId: req.user._id, villageId: req.villageId });
    if (!citizen) citizen = await M.Citizen.create({ villageId: req.villageId, userId: req.user._id, name: req.user.name, phone: req.user.phone, email: req.user.email });
    citizenId = citizen._id;
  } else {
    // Officials may register a grievance on behalf of a citizen (e.g. walk-in at the Panchayat office).
    if (!b.citizenId) throw ApiError.badRequest('citizenId is required when filing on behalf of a citizen');
    const c = await M.Citizen.findOne({ _id: b.citizenId, villageId: req.villageId });
    if (!c) throw ApiError.badRequest('Citizen not found in this village');
    citizenId = c._id;
  }
  const g = new M.Grievance({
    ...pick(b, ['category', 'subject', 'description', 'location', 'ward', 'priority']),
    villageId: req.villageId, citizenId,
    submittedBy: req.user.role === 'CITIZEN' ? req.user._id : null,
    status: 'SUBMITTED',
    history: [{ status: 'SUBMITTED', action: 'Submitted', by: req.user._id, byName: req.user.name }],
  });
  await g.validate(); // validate before consuming a reference number
  g.referenceNumber = await nextReference(req.villageId);
  await g.save();
  await notifyVillage(req.villageId, {
    title: `New grievance ${g.referenceNumber}`, message: `${g.category}: ${g.subject}`, type: 'GRIEVANCE', link: `/grievances?open=${g._id}`,
  }, MANAGERS);
  await notifyCitizen(g, `Grievance received: ${g.referenceNumber}`, 'Your complaint has been registered. You can track its status any time.');
  created(res, await g.populate(POPULATE), `Grievance submitted. Reference number: ${g.referenceNumber}`);
});

exports.assign = asyncHandler(async (req, res) => {
  const g = await M.Grievance.findOne({ _id: req.params.id, villageId: req.villageId });
  if (!g) throw ApiError.notFound('Grievance not found');
  const assignee = await M.User.findOne({ _id: req.body.assignedTo, villageId: req.villageId, role: { $in: OFFICIALS }, status: 'ACTIVE' });
  if (!assignee) throw ApiError.badRequest('Select a valid officer or staff member');
  g.assignedTo = assignee._id;
  if (g.status === 'SUBMITTED') { g.status = 'ACKNOWLEDGED'; g.acknowledgedAt = new Date(); }
  if (req.body.priority) g.priority = req.body.priority;
  g.history.push({ status: g.status, action: `Assigned to ${assignee.name}`, note: req.body.note, by: req.user._id, byName: req.user.name });
  await g.save();
  if (String(assignee._id) !== String(req.user._id)) {
    await notifyUser(g.villageId, assignee._id, { title: `Grievance assigned: ${g.referenceNumber}`, message: g.subject, type: 'GRIEVANCE', link: `/grievances?open=${g._id}` });
  }
  await notifyCitizen(g, `Update on ${g.referenceNumber}`, `Your grievance has been acknowledged and assigned to ${assignee.designation || 'an officer'}.`);
  ok(res, await g.populate(POPULATE), 'Grievance assigned');
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const g = await M.Grievance.findOne({ _id: req.params.id, villageId: req.villageId });
  if (!g) throw ApiError.notFound('Grievance not found');
  if (req.user.role === 'STAFF' && String(g.assignedTo) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only process grievances assigned to you');
  }
  const { status, note, resolution } = req.body || {};
  if (!GRIEVANCE_STATUSES.includes(status)) throw ApiError.badRequest('Invalid status');
  if (status !== g.status && !(TRANSITIONS[g.status] || []).includes(status)) {
    throw ApiError.badRequest(`Cannot move a grievance from ${g.status} to ${status}`);
  }
  if (status === 'RESOLVED' && !(resolution || g.resolution)) throw ApiError.badRequest('Please describe the resolution before closing');
  if (status === 'REJECTED' && !(note || resolution)) throw ApiError.badRequest('Please give a reason for rejection');

  g.status = status;
  if (resolution) g.resolution = String(resolution).slice(0, 2000);
  if (status === 'ACKNOWLEDGED' && !g.acknowledgedAt) g.acknowledgedAt = new Date();
  g.resolvedAt = ['RESOLVED', 'REJECTED'].includes(status) ? new Date() : undefined;
  g.history.push({ status, action: `Status changed to ${status.replace('_', ' ')}`, note: note || resolution, by: req.user._id, byName: req.user.name });
  await g.save();
  await notifyCitizen(g, `Grievance ${g.referenceNumber}: ${status.replace('_', ' ')}`,
    status === 'RESOLVED' ? `Resolved — ${g.resolution}` : (note || 'The status of your grievance has changed.'));
  ok(res, await g.populate(POPULATE), 'Grievance status updated');
});

exports.remove = asyncHandler(async (req, res) => {
  const g = await M.Grievance.findOneAndDelete({ _id: req.params.id, villageId: req.villageId });
  if (!g) throw ApiError.notFound('Grievance not found');
  ok(res, { _id: g._id }, 'Grievance deleted');
});
