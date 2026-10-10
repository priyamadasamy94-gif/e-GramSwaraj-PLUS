const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { OTPVerification } = require('../models');
const ApiError = require('../utils/ApiError');

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_RESENDS = 3;

function unwrapIdentifierCandidate(value) {
  if (value == null) return '';
  if (typeof value === 'object') {
    if (Array.isArray(value) && value.length) return unwrapIdentifierCandidate(value[0]);
    const nestedValue = value.phone ?? value.userIdentifier ?? value.mobile ?? value.value ?? value.identifier;
    if (nestedValue !== undefined && nestedValue !== null) {
      return unwrapIdentifierCandidate(nestedValue);
    }
    if (typeof value.toString === 'function' && value.toString !== Object.prototype.toString) {
      const coerced = String(value.toString()).trim();
      if (coerced && coerced !== '[object Object]' && !coerced.startsWith('{') && !coerced.startsWith('[')) {
        return coerced;
      }
    }
    return '';
  }
  return String(value).trim();
}

function normalizePhone(value) {
  const raw = unwrapIdentifierCandidate(value);
  if (!raw) return '';
  const cleaned = raw.replace(/[^\d+]/g, '').trim();
  if (!cleaned) return '';
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith('0')) return `+91${cleaned.slice(1)}`;
  return `+${cleaned}`;
}

function normalizeIdentifier(value) {
  const text = unwrapIdentifierCandidate(value);
  if (!text) return '';
  if (text.includes('@')) return text.toLowerCase();
  return normalizePhone(text);
}

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString().padStart(6, '0');
}

async function hashOtp(otp) {
  return bcrypt.hash(String(otp), 12);
}

function maskIdentifier(value) {
  const identifier = normalizeIdentifier(value || '');
  if (!identifier) return 'unknown';
  if (identifier.includes('@')) {
    const [local, domain] = identifier.split('@');
    return `${local.slice(0, 2)}***@${domain}`;
  }
  const digits = identifier.replace(/\D/g, '');
  if (digits.length <= 4) return '******';
  return `******${digits.slice(-4)}`;
}

async function findPendingOtp({ userIdentifier, purpose = 'REGISTRATION' }) {
  const normalized = normalizeIdentifier(userIdentifier);
  return OTPVerification.findOne({
    where: { userIdentifier: normalized, purpose, verified: false },
    order: [['createdAt', 'DESC']],
  });
}

async function createOtpRecord({ userIdentifier, purpose = 'REGISTRATION', registrationData = {} }) {
  const normalized = normalizeIdentifier(userIdentifier);
  if (!normalized) throw ApiError.badRequest('A valid mobile number is required for OTP verification.');

  const existing = await findPendingOtp({ userIdentifier: normalized, purpose });
  if (existing) {
    if (Number(existing.resendCount) >= MAX_RESENDS) {
      throw new ApiError(429, 'OTP resend limit exceeded. Please try again later.');
    }
    const otp = generateOtp();
    existing.otpHash = await hashOtp(otp);
    existing.expiresAt = new Date(Date.now() + OTP_TTL_MS);
    existing.attemptCount = 0;
    existing.resendCount = Number(existing.resendCount || 0) + 1;
    existing.registrationData = registrationData || existing.registrationData || {};
    existing.verified = false;
    await existing.save();
    return { otp, record: existing, isResend: true };
  }

  const otp = generateOtp();
  const record = await OTPVerification.create({
    userIdentifier: normalized,
    otpHash: await hashOtp(otp),
    purpose,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    attemptCount: 0,
    resendCount: 0,
    verified: false,
    registrationData,
  });

  return { otp, record, isResend: false };
}

async function verifyOtp({ userIdentifier, otp, purpose = 'REGISTRATION' }) {
  const normalized = normalizeIdentifier(userIdentifier);
  const record = await findPendingOtp({ userIdentifier: normalized, purpose });

  if (!record) {
    throw new ApiError(400, 'Invalid OTP. Please check and try again.');
  }

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    record.verified = true;
    await record.save();
    throw new ApiError(410, 'OTP expired. Please request a new OTP.');
  }

  const limitReached = Number(record.attemptCount || 0) >= MAX_ATTEMPTS;
  if (limitReached) {
    throw new ApiError(429, 'Too many attempts. Please request a new OTP.');
  }

  const match = await bcrypt.compare(String(otp), record.otpHash);
  if (!match) {
    record.attemptCount = Number(record.attemptCount || 0) + 1;
    await record.save();
    if (Number(record.attemptCount || 0) >= MAX_ATTEMPTS) {
      throw new ApiError(429, 'Too many attempts. Please request a new OTP.');
    }
    throw new ApiError(400, 'Invalid OTP. Please check and try again.');
  }

  record.attemptCount = Number(record.attemptCount || 0) + 1;
  record.verified = true;
  record.expiresAt = new Date();
  await record.save();
  return record;
}

async function resendOtp({ userIdentifier, purpose = 'REGISTRATION', registrationData = {} }) {
  const normalized = normalizeIdentifier(userIdentifier);
  const record = await findPendingOtp({ userIdentifier: normalized, purpose });

  if (!record) {
    throw new ApiError(400, 'No pending OTP found. Please submit the registration form again.');
  }

  if (Number(record.resendCount || 0) >= MAX_RESENDS) {
    throw new ApiError(429, 'OTP resend limit exceeded. Please try again later.');
  }

  const recentWindow = new Date(Date.now() - (15 * 60 * 1000));
  const recentRecords = await OTPVerification.findAll({
    where: {
      userIdentifier: normalized,
      purpose,
      createdAt: { [Op.gte]: recentWindow },
    },
  });

  if (recentRecords.length >= MAX_RESENDS + 1) {
    throw new ApiError(429, 'OTP resend limit exceeded. Please try again later.');
  }

  const result = await createOtpRecord({ userIdentifier: normalized, purpose, registrationData: registrationData || record.registrationData || {} });
  return result;
}

module.exports = {
  OTP_TTL_MS,
  MAX_ATTEMPTS,
  MAX_RESENDS,
  normalizePhone,
  normalizeIdentifier,
  generateOtp,
  hashOtp,
  maskIdentifier,
  createOtpRecord,
  verifyOtp,
  resendOtp,
  findPendingOtp,
};
