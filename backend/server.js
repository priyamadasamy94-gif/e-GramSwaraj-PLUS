const { port } = require('./config/env');
const { connectDB, sequelize } = require('./config/db');
const app = require('./app');
const { startReminderJob } = require('./jobs/reminders');
(async () => {
  try {
    await connectDB();
  } catch {
    process.exit(1);
  }
  const server = app.listen(port, () => console.log(`[api] E-GramSwaraj+ API running on http://localhost:${port}/api`));
  startReminderJob();
  const shutdown = () => server.close(async () => {
    await sequelize.close();
    process.exit(0);
  });
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})();
