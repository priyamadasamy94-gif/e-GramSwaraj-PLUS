const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/** Verifies the Bearer token, loads the user and pins the request to the user's village. */
const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret);
  } catch (e) {
    throw ApiError.unauthorized(e.name === 'TokenExpiredError' ? 'Session expired, please log in again' : 'Invalid token');
  }
  const user = await User.findById(payload.id);
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if (user.status !== 'ACTIVE') throw ApiError.forbidden('Your account is not active');

  req.user = user;
  // Village isolation: every village-scoped query uses this id, never a client-supplied one.
  req.villageId = user.villageId;
  next();
});

/** Restrict a route to specific roles. */
const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.flat().includes(req.user.role)) return next(ApiError.forbidden());
  next();
};

module.exports = { protect, authorize };
