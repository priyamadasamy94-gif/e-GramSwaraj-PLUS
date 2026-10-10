const test = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');
const { OTPVerification } = require('../models');
const { generateOtp, hashOtp, normalizePhone, verifyOtp } = require('../services/otpService');
const { NotificationService } = require('../services/notificationService');

const originalFetch = global.fetch;
const originalCreateTransport = nodemailer.createTransport;

function setEnv() {
  process.env.SMS_PROVIDER = 'mock';
  process.env.WHATSAPP_PROVIDER = 'meta';
  process.env.WHATSAPP_ACCESS_TOKEN = 'token';
  process.env.WHATSAPP_PHONE_NUMBER_ID = '123456789';
  process.env.EMAIL_HOST = 'smtp.example.com';
  process.env.EMAIL_PORT = '587';
  process.env.EMAIL_USER = 'user@example.com';
  process.env.EMAIL_PASSWORD = 'secret';
  process.env.EMAIL_FROM = 'user@example.com';
}

test('registration OTP generation creates a six-digit code', () => {
  const otp = generateOtp();
  assert.match(otp, /^\d{6}$/);
  assert.equal(otp.length, 6);
});

test('OTP hashing is one-way and verifiable', async () => {
  const hashed = await hashOtp('123456');
  assert.notEqual(hashed, '123456');
  assert.match(hashed, /^\$2[aby]\$/);
});

test('mobile number normalization keeps a valid E.164 value', () => {
  assert.equal(normalizePhone('9876543210'), '+919876543210');
  assert.equal(normalizePhone('+91 98765 43210'), '+919876543210');
  assert.equal(normalizePhone({ userIdentifier: '6381653189' }), '+916381653189');
  assert.equal(normalizePhone({ phone: '+91 6381653189' }), '+916381653189');
});

test('identifier normalization accepts nested registration values safely', () => {
  assert.equal(normalizePhone({ userIdentifier: { value: '+91 6381653189' } }), '+916381653189');
  assert.equal(normalizePhone({ mobile: '6381653189' }), '+916381653189');
  assert.equal(normalizePhone({ userIdentifier: { userIdentifier: '+91 6381653189' } }), '+916381653189');
  assert.equal(normalizePhone({ toString: () => '{ userIdentifier: "+916381653189" }' }), '');
});

test('invalid OTP is rejected with a clear error', async () => {
  const originalFindOne = OTPVerification.findOne;
  const originalSave = OTPVerification.prototype?.save || null;

  OTPVerification.findOne = async () => ({
    otpHash: await hashOtp('654321'),
    expiresAt: new Date(Date.now() + 120000),
    attemptCount: 0,
    save: async function () {
      this.attemptCount = Number(this.attemptCount || 0) + 1;
      return this;
    },
  });

  await assert.rejects(
    () => verifyOtp({ userIdentifier: '+919876543210', otp: '123456', purpose: 'REGISTRATION' }),
    (error) => error.statusCode === 400 && /Invalid OTP/.test(error.message),
  );

  OTPVerification.findOne = originalFindOne;
  if (originalSave) OTPVerification.prototype.save = originalSave;
});

test('valid OTP is accepted', async () => {
  const originalFindOne = OTPVerification.findOne;
  const otp = '654321';
  const record = {
    otpHash: await hashOtp(otp),
    expiresAt: new Date(Date.now() + 120000),
    attemptCount: 0,
    verified: false,
    save: async function () {
      this.verified = true;
      return this;
    },
  };

  OTPVerification.findOne = async () => record;

  const validated = await verifyOtp({ userIdentifier: '+919876543210', otp, purpose: 'REGISTRATION' });
  assert.equal(validated.verified, true);
  OTPVerification.findOne = originalFindOne;
});

test('SMS service uses mock provider successfully', async () => {
  setEnv();
  global.fetch = async () => ({ ok: true, text: async () => '' });
  const response = await NotificationService.sendSMS({ to: '+919876543210', message: 'hello', otp: '123456' });
  assert.equal(response.status, 'sent');
  global.fetch = originalFetch;
});

test('SMS delivery is optional when no provider is configured', async () => {
  delete process.env.SMS_PROVIDER;
  delete process.env.SMS_API_KEY;
  delete process.env.SMS_API_URL;

  const response = await NotificationService.sendSMS({
    to: '+919876543210',
    message: 'Your OTP is 123456',
    otp: '123456',
  });

  assert.equal(response.status, 'skipped');
  assert.equal(response.reason, 'provider-not-configured');
});

test('WhatsApp service calls Meta API when configured', async () => {
  setEnv();
  global.fetch = async () => ({ ok: true, text: async () => '' });
  const response = await NotificationService.sendWhatsApp({ to: '+919876543210', message: 'Welcome', otp: '123456' });
  assert.equal(response.status, 'sent');
  global.fetch = originalFetch;
});

test('Email service delegates to SMTP transport', async () => {
  setEnv();
  nodemailer.createTransport = () => ({
    sendMail: async () => ({ messageId: 'abc123' }),
  });

  const response = await NotificationService.sendEmail({
    to: 'citizen@example.com',
    subject: 'Registration Successful',
    text: 'Welcome!',
    html: '<p>Welcome!</p>',
  });

  assert.equal(response.status, 'sent');
  nodemailer.createTransport = originalCreateTransport;
});

test.after(() => {
  global.fetch = originalFetch;
  nodemailer.createTransport = originalCreateTransport;
});
