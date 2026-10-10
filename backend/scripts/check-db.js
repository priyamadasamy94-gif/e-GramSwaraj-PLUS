/**
 * npm run check-db
 * Verifies the MySQL connection and that every record references the South Thittankulam village.
 */
const { connectDB, sequelize } = require('../config/db');
const { activeVillageCode } = require('../config/env');
const M = require('../models');

(async () => {
  await connectDB();
  const v = await M.Village.findOne({ villageCode: activeVillageCode });
  if (!v) { console.log(`\n✗ Village ${activeVillageCode} not found — run: npm run seed\n`); return; }
  console.log(`\n✓ Active village: ${v.name}, ${v.taluk}, ${v.state} – ${v.pincode}  (_id ${v._id})\n`);
  const rows = {};
  for (const name of ['User', 'Citizen', 'DevelopmentPlan', 'Work', 'Asset', 'Budget', 'FinancialTransaction', 'Meeting', 'Grievance', 'Announcement', 'Notification']) {
    const total = await M[name].countDocuments();
    const linked = await M[name].countDocuments({ villageId: v._id });
    rows[name] = { total, linkedToVillage: linked, ok: total === linked ? '✓' : '✗' };
  }
  console.table(rows);
})().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => sequelize.close());
