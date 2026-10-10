const path = require('path');
// Load backend/.env first, then fall back to a project-root .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const required = ['MYSQL_HOST', 'MYSQL_DATABASE', 'MYSQL_USER', 'JWT_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`\n[config] Missing required environment variable(s): ${missing.join(', ')}`);
  console.error('[config] Copy .env.example (project root) to .env and fill in the values.\n');
  process.exit(1);
}

module.exports = {
  port: Number(process.env.PORT) || 5000,
  mysql: {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT) || 3306,
    database: process.env.MYSQL_DATABASE,
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD || '',
  },
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  googleTranslateApiKey: process.env.GOOGLE_TRANSLATE_API_KEY || '',
  googleClientId: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  activeVillageCode: process.env.ACTIVE_VILLAGE_CODE || 'STK',
  sms: {
    provider: process.env.SMS_PROVIDER || '',
    apiKey: process.env.SMS_API_KEY || '',
    senderId: process.env.SMS_SENDER_ID || '',
  },
  whatsapp: {
    provider: process.env.WHATSAPP_PROVIDER || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v19.0',
    templateName: process.env.WHATSAPP_TEMPLATE_NAME || '',
  },
  email: {
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    host: process.env.EMAIL_HOST || '',
    port: Number(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || '',
  },
};
