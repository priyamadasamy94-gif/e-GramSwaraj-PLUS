const { Sequelize } = require('sequelize');
const { mysql } = require('./env');

const sequelize = new Sequelize(mysql.database, mysql.username, mysql.password, {
  host: mysql.host,
  port: mysql.port,
  dialect: 'mysql',
  logging: false,
  define: { timestamps: true, underscored: false },
  pool: { min: 0, max: 10, acquire: 15000, idle: 10000 },
});
let status = 'disconnected';

async function connectDB() {
  try {
    status = 'connecting';
    await sequelize.authenticate();

    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();
    const tableNames = new Set((tables || []).map((table) => String(table).toLowerCase()));

    if (tableNames.size === 0) {
      console.log('[db] No app tables found. Creating schema once...');
      await sequelize.sync({ alter: false, force: false });
    } else if (!tableNames.has('otpverifications')) {
      console.log('[db] Missing OTP verification table; creating that table only.');
      const { OTPVerification } = require('../models');
      await OTPVerification.sync({ alter: false, force: false });
    }

    if (tableNames.size > 0 && !tableNames.has('translationcache')) {
      console.log('[db] Creating the separate translation cache table.');
      const { TranslationCache } = require('../models');
      await TranslationCache.sync({ alter: false, force: false });
    }

    if (tableNames.size > 0) {
      console.log(`[db] Schema already exists for ${mysql.database}; skipping broad auto-sync to avoid MySQL index-limit failures.`);
    }

    status = 'connected';
    console.log(`[db] MySQL connected: ${mysql.host}:${mysql.port}/${mysql.database}`);
    return sequelize;
  } catch (err) {
    status = 'disconnected';
    console.error('[db] MySQL connection failed:', err.message);
    console.error('[db] Check MYSQL_HOST, MYSQL_PORT, MYSQL_DATABASE, MYSQL_USER, and MYSQL_PASSWORD.');
    throw err;
  }
}

function dbStatus() {
  return status;
}

module.exports = { sequelize, connectDB, dbStatus };
