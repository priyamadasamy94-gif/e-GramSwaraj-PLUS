const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { jwtSecret, jwtExpiresIn, activeVillageCode, googleClientId } = require('../config/env');
const { User, Village, Citizen, OTPVerification } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/response');
const { SUPPORTED_LANGUAGES } = require('../services/translationService');
const { NotificationService } = require('../services/notificationService');
const { createOtpRecord, verifyOtp, resendOtp, normalizePhone } = require('../services/otpService');

async function emailRegistrationOtp(email, otp) {
  const message = `Your eGramSwaraj Plus verification OTP is ${otp}. It is valid for 5 minutes. Do not share this OTP with anyone.`;
  return NotificationService.sendEmail({
    to: email,
    subject: 'Your eGramSwaraj Plus verification OTP',
    text: message,
    html: `<p>${message}</p>`,
  });
}

const sign = (user) => jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });

async function activeVillage() {
  const v = await Village.findOne({ villageCode: activeVillageCode, status: 'ACTIVE' });
  if (!v) throw new ApiError(503, 'Active village is not configured. Run `npm run seed` first.');
  return v;
}

function assertString(v, name, min = 1, max = 200) {
  if (typeof v !== 'string' || v.trim().length < min || v.length > max) {
    throw ApiError.badRequest(`${name} is required${min > 1 ? ` (min ${min} characters)` : ''}`);
  }
  return v.trim();
}

function parseRegistrationPayload(body) {
  const name = assertString(body.name, 'Name', 2, 100);
  const email = assertString(body.email, 'Email', 5, 120).toLowerCase();
  const password = assertString(body.password, 'Password', 8, 100);
  const phone = normalizePhone(body.phone ?? body.userIdentifier ?? body.mobile ?? body.identifier);
  if (!phone || !/^\+[1-9]\d{9,14}$/.test(phone)) throw ApiError.badRequest('Enter a valid mobile number');
  const ward = typeof body.ward === 'string' ? body.ward.trim() : undefined;
  const address = typeof body.address === 'string' ? body.address.trim() : undefined;
  return { name, email, password, phone, ward, address };
}

exports.register = asyncHandler(async (req, res) => {
  const payload = parseRegistrationPayload(req.body);
  const village = await activeVillage();

  if (await User.exists({ email: payload.email })) throw new ApiError(409, 'An account with this email already exists');
  if (await User.exists({ phone: payload.phone })) throw new ApiError(409, 'An account with this mobile number already exists');

  const pending = await createOtpRecord({ userIdentifier: payload.phone, purpose: 'REGISTRATION', registrationData: { ...payload, villageId: village._id } });
  try {
    await emailRegistrationOtp(payload.email, pending.otp);
    console.info('[auth] Registration OTP sent by email.');
  } catch (error) {
    console.warn('[auth] Email OTP delivery failed safely:', error.message);
  }

  if (process.env.NODE_ENV === 'development') {
    console.info(`\n[auth] 🔑 DEVELOPMENT REGISTRATION OTP FOR ${payload.phone} (${payload.email}): ${pending.otp}\n`);
  }

  ok(res, {
    otpSent: true,
    userIdentifier: payload.phone,
    expiresInSeconds: 300,
    ...(process.env.NODE_ENV === 'development' ? { devOtp: pending.otp } : {}),
  }, 'OTP sent to your email address');
});

exports.sendOtp = asyncHandler(async (req, res) => {
  const phone = normalizePhone(req.body.phone ?? req.body.userIdentifier ?? req.body.mobile ?? req.body.identifier);
  if (!phone) throw ApiError.badRequest('A valid mobile number is required');
  const active = await OTPVerification.findOne({ where: { userIdentifier: phone, purpose: 'REGISTRATION', verified: false }, order: [['createdAt', 'DESC']] });
  if (!active) throw new ApiError(404, 'No pending registration OTP found. Please submit the registration form again.');

  const { otp } = await resendOtp({ userIdentifier: phone, registrationData: active.registrationData || {} });
  try {
    await emailRegistrationOtp(active.registrationData?.email, otp);
    console.info('[auth] Registration OTP sent by email.');
  } catch (error) {
    console.warn('[auth] Email OTP delivery failed safely:', error.message);
  }

  if (process.env.NODE_ENV === 'development') {
    console.info(`\n[auth] 🔑 DEVELOPMENT RESENT OTP FOR ${phone}: ${otp}\n`);
  }

  ok(res, {
    otpSent: true,
    userIdentifier: phone,
    expiresInSeconds: 300,
    ...(process.env.NODE_ENV === 'development' ? { devOtp: otp } : {}),
  }, 'OTP sent to your email address');
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  const phone = normalizePhone(req.body.phone ?? req.body.userIdentifier ?? req.body.mobile ?? req.body.identifier);
  const otp = assertString(req.body.otp, 'OTP', 6, 6);
  const pending = await verifyOtp({ userIdentifier: phone, otp, purpose: 'REGISTRATION' });
  const data = pending.registrationData || {};

  if (!data.name || !data.email || !data.password) {
    throw new ApiError(400, 'The verification record is incomplete. Please start the registration process again.');
  }

  if (await User.exists({ email: data.email })) throw new ApiError(409, 'An account with this email already exists');
  if (await User.exists({ phone: data.phone })) throw new ApiError(409, 'An account with this mobile number already exists');

  const village = await activeVillage();
  const user = await User.create({
    name: data.name,
    email: data.email,
    password: data.password,
    phone: data.phone,
    role: 'CITIZEN',
    villageId: village._id,
  });

  await Citizen.create({
    villageId: village._id,
    userId: user._id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    ward: typeof data.ward === 'string' ? data.ward : undefined,
    address: typeof data.address === 'string' ? data.address : undefined,
    status: 'ACTIVE',
  });

  await NotificationService.notifyCitizen({
    user,
    citizen: { villageId: village._id, userId: user._id, phone: data.phone, email: data.email },
    eventType: 'REGISTRATION_SUCCESS',
    title: 'Registration Successful',
    message: 'Your eGramSwaraj Plus citizen account has been successfully registered.',
    channels: ['whatsapp', 'email'],
    data: { otp },
  });

  ok(res, { token: sign(user), user: user.toJSON() }, 'Mobile number verified successfully.');
});

exports.resendOtp = asyncHandler(async (req, res) => {
  const phone = normalizePhone(req.body.phone ?? req.body.userIdentifier ?? req.body.mobile ?? req.body.identifier);
  if (!phone) throw ApiError.badRequest('A valid mobile number is required');
  const record = await OTPVerification.findOne({ where: { userIdentifier: phone, purpose: 'REGISTRATION', verified: false }, order: [['createdAt', 'DESC']] });
  if (!record) throw new ApiError(404, 'No pending registration OTP found. Please submit the registration form again.');

  const { otp } = await resendOtp({ userIdentifier: phone, registrationData: record.registrationData || {} });
  try {
    await emailRegistrationOtp(record.registrationData?.email, otp);
    console.info('[auth] Registration OTP resent by email.');
  } catch (error) {
    console.warn('[auth] Email OTP delivery failed safely:', error.message);
  }

  if (process.env.NODE_ENV === 'development') {
    console.info(`\n[auth] 🔑 DEVELOPMENT RESENT OTP FOR ${phone}: ${otp}\n`);
  }

  ok(res, {
    otpSent: true,
    userIdentifier: phone,
    expiresInSeconds: 300,
    ...(process.env.NODE_ENV === 'development' ? { devOtp: otp } : {}),
  }, 'OTP sent to your email address');
});

exports.login = asyncHandler(async (req, res) => {
  const email = assertString(req.body.email, 'Email').toLowerCase();
  const password = assertString(req.body.password, 'Password');
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw ApiError.unauthorized('Invalid email or password');
  if (user.status !== 'ACTIVE') throw ApiError.forbidden('Your account is not active. Contact the Panchayat office.');
  user.lastLoginAt = new Date();
  await user.save();
  ok(res, { token: sign(user), user: user.toJSON() }, 'Login successful');
});

exports.google = asyncHandler(async (req, res) => {
  if (!googleClientId) throw new ApiError(503, 'Google sign-in is not configured on the server.');

  const credential = assertString(req.body.credential, 'Google credential', 20, 5000);
  const verificationUrl = new URL('https://oauth2.googleapis.com/tokeninfo');
  verificationUrl.searchParams.set('id_token', credential);

  let verificationResponse;
  try {
    verificationResponse = await fetch(verificationUrl);
  } catch {
    throw new ApiError(503, 'Google sign-in verification is temporarily unavailable.');
  }
  if (!verificationResponse.ok) throw ApiError.unauthorized('Google sign-in could not be verified. Please try again.');

  let profile;
  try {
    profile = await verificationResponse.json();
  } catch {
    throw ApiError.unauthorized('Google sign-in could not be verified. Please try again.');
  }

  const validIssuer = ['accounts.google.com', 'https://accounts.google.com'].includes(profile.iss);
  const verifiedEmail = profile.email_verified === true || profile.email_verified === 'true';
  if (profile.aud !== googleClientId || !validIssuer || !profile.sub || !verifiedEmail || !profile.email) {
    throw ApiError.unauthorized('Google sign-in could not be verified. Please try again.');
  }

  const email = profile.email.trim().toLowerCase();
  let user = await User.findOne({ email });
  if (!user) {
    const village = await activeVillage();
    const name = typeof profile.name === 'string' && profile.name.trim()
      ? profile.name.trim().slice(0, 100)
      : email.split('@')[0].slice(0, 100);
    user = await User.create({
      name,
      email,
      password: crypto.randomBytes(32).toString('base64url'),
      role: 'CITIZEN',
      villageId: village._id,
    });
    await Citizen.create({ villageId: village._id, userId: user._id, name, email });
  }

  if (user.status !== 'ACTIVE') throw ApiError.forbidden('Your account is not active. Contact the Panchayat office.');
  user.lastLoginAt = new Date();
  await user.save();
  ok(res, { token: sign(user), user: user.toJSON() }, 'Login successful');
});

exports.me = asyncHandler(async (req, res) => {
  const village = await Village.findById(req.user.villageId).select('name villageCode panchayatName taluk district state pincode');
  ok(res, { user: req.user, village });
});

exports.updateMe = asyncHandler(async (req, res) => {
  const { name, phone, language } = req.body;
  if (name !== undefined) req.user.name = assertString(name, 'Name', 2, 100);
  if (phone !== undefined) req.user.phone = normalizePhone(phone);
  if (language !== undefined) {
    const normalized = String(language).trim().toLowerCase();
    if (!SUPPORTED_LANGUAGES.includes(normalized)) {
      throw ApiError.badRequest(`Language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`);
    }
    req.user.language = normalized;
  }
  await req.user.save();
  if (req.user.role === 'CITIZEN') await Citizen.updateOne({ userId: req.user._id }, { name: req.user.name, phone: req.user.phone });
  ok(res, req.user, 'Profile updated');
});

exports.changePassword = asyncHandler(async (req, res) => {
  const current = assertString(req.body.currentPassword, 'Current password');
  const next = assertString(req.body.newPassword, 'New password', 8, 100);
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(current))) throw ApiError.badRequest('Current password is incorrect');
  user.password = next;
  await user.save();
  ok(res, null, 'Password changed successfully');
});

exports.activeVillage = activeVillage;
