require('dotenv').config({ path: './.env' });
const { connectDB } = require('./config/db');
const { OTPVerification } = require('./models');

(async () => {
  try {
    await connectDB();
    const value = '+916381653189';
    const row = await OTPVerification.create({
      userIdentifier: value,
      otpHash: 'x',
      purpose: 'REGISTRATION',
      expiresAt: new Date(Date.now() + 60000),
      attemptCount: 0,
      resendCount: 0,
      verified: false,
      registrationData: { name: 'Test', email: 'test@example.com', password: 'abc12345' }
    });
    console.log('CREATE_OK', JSON.stringify(row.toJSON()));
  } catch (e) {
    console.error('ERR_NAME', e.name);
    console.error('ERR_MSG', e.message);
    console.error('ERR_ERRORS', JSON.stringify(e.errors));
    if (e.original) console.error('ORIGINAL', e.original.message);
    process.exitCode = 1;
  }
})();
