const { Notification } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/response');
const { parsePagination } = require('../utils/query');
const { NOTIFICATION_TYPES } = require('../config/constants');

const mine = (req) => ({ userId: req.user._id, villageId: req.villageId });

exports.list = asyncHandler(async (req, res) => {
  const filter = mine(req);
  if (req.query.read === 'true') filter.read = true;
  if (req.query.read === 'false') filter.read = false;
  if (NOTIFICATION_TYPES.includes(req.query.type)) filter.type = req.query.type;
  const { page, limit, skip } = parsePagination(req.query);
  const [items, total, unread] = await Promise.all([
    Notification.find(filter).sort('-createdAt').skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...mine(req), read: false }),
  ]);
  ok(res, items, 'Notifications', 200, { page, limit, total, pages: Math.ceil(total / limit) || 1, unread });
});

exports.unreadCount = asyncHandler(async (req, res) => {
  ok(res, { count: await Notification.countDocuments({ ...mine(req), read: false }) });
});

exports.markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, ...mine(req) }, { read: true }, { new: true });
  if (!n) throw ApiError.notFound('Notification not found');
  ok(res, n, 'Marked as read');
});

exports.markAllRead = asyncHandler(async (req, res) => {
  const r = await Notification.updateMany({ ...mine(req), read: false }, { read: true });
  ok(res, { modified: r.modifiedCount }, 'All notifications marked as read');
});

exports.remove = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndDelete({ _id: req.params.id, ...mine(req) });
  if (!n) throw ApiError.notFound('Notification not found');
  ok(res, { _id: n._id }, 'Notification deleted');
});
