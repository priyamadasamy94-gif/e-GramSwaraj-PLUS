const { User, Citizen } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/response');
const { buildFilter, parsePagination, parseSort, pick } = require('../utils/query');
const { ALL_ROLES, OFFICIALS } = require('../config/constants');

exports.list = asyncHandler(async (req, res) => {
  const filter = { ...buildFilter(req.query, { searchFields: ['name', 'email', 'phone', 'designation'], filterFields: ['role', 'status'] }), villageId: req.villageId };
  const { page, limit, skip } = parsePagination(req.query);
  const sort = parseSort(req.query.sort, ['name', 'email', 'role', 'createdAt', 'lastLoginAt'], 'name');
  const [items, total] = await Promise.all([User.find(filter).sort(sort).skip(skip).limit(limit), User.countDocuments(filter)]);
  ok(res, items, 'Users', 200, { page, limit, total, pages: Math.ceil(total / limit) || 1 });
});

/** Officers & staff who can be assigned works/grievances. */
exports.officials = asyncHandler(async (req, res) => {
  ok(res, await User.find({ villageId: req.villageId, role: { $in: OFFICIALS }, status: 'ACTIVE' }).select('name role designation').sort('name'));
});

exports.create = asyncHandler(async (req, res) => {
  const b = req.body || {};
  if (!ALL_ROLES.includes(b.role)) throw ApiError.badRequest('Invalid role');
  if (typeof b.password !== 'string' || b.password.length < 8) throw ApiError.badRequest('Password must be at least 8 characters');
  const user = await User.create({ ...pick(b, ['name', 'email', 'password', 'role', 'phone', 'designation', 'status']), villageId: req.villageId });
  if (user.role === 'CITIZEN') await Citizen.create({ villageId: req.villageId, userId: user._id, name: user.name, email: user.email, phone: user.phone });
  created(res, user, 'User created successfully');
});

exports.update = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, villageId: req.villageId });
  if (!user) throw ApiError.notFound('User not found');
  const b = req.body || {};
  if (String(user._id) === String(req.user._id) && (b.role && b.role !== user.role || b.status && b.status !== 'ACTIVE')) {
    throw ApiError.badRequest('You cannot change your own role or deactivate yourself');
  }
  user.set(pick(b, ['name', 'email', 'role', 'phone', 'designation', 'status']));
  if (b.password) {
    if (String(b.password).length < 8) throw ApiError.badRequest('Password must be at least 8 characters');
    user.password = b.password;
  }
  await user.save();
  ok(res, user, 'User updated successfully');
});

exports.remove = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) throw ApiError.badRequest('You cannot delete your own account');
  const user = await User.findOneAndDelete({ _id: req.params.id, villageId: req.villageId });
  if (!user) throw ApiError.notFound('User not found');
  await Citizen.updateMany({ userId: user._id }, { userId: null });
  ok(res, { _id: user._id }, 'User deleted');
});
