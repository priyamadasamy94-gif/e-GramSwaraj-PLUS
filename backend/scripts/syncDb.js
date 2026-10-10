const { sequelize } = require('../config/db');
require('../models');

async function sync() {
  console.log('Starting DB sync (force: true)...');
  await sequelize.sync({ force: true });
  console.log('DB sync completed.');
  process.exit(0);
}
sync().catch(err => {
  console.error(err);
  process.exit(1);
});
