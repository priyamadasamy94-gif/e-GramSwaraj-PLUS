/**
 * Background reminders (runs on server start and every 6 hours):
 *  - upcoming meetings in the next 3 days → all users
 *  - assets whose maintenance is due within 7 days / overdue → managers & staff
 * dedupeKey guarantees each reminder is created once per user.
 */
const M = require('../models');
const { notifyVillage } = require('../services/notificationService');
const { OFFICIALS } = require('../config/constants');

async function runReminders() {
  const now = new Date();
  const soon = new Date(now.getTime() + 3 * 86400000);
  const meetings = await M.Meeting.find({ status: 'SCHEDULED', isPublic: true, date: { $gte: now, $lte: soon } });
  for (const m of meetings) {
    await notifyVillage(m.villageId, {
      title: `Reminder: ${m.title}`,
      message: `${m.date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })} — ${m.location || 'Panchayat Office'}`,
      type: 'MEETING', link: '/meetings', dedupeKey: `meeting-reminder-${m._id}`,
    });
  }
  const horizon = new Date(now.getTime() + 7 * 86400000);
  const assets = await M.Asset.find({ status: { $ne: 'DECOMMISSIONED' }, maintenanceDate: { $ne: null, $lte: horizon } });
  for (const a of assets) {
    const overdue = a.maintenanceDate < now;
    await notifyVillage(a.villageId, {
      title: `${overdue ? 'Overdue' : 'Upcoming'} maintenance: ${a.name}`,
      message: `${a.type} at ${a.location || 'village'} — scheduled ${a.maintenanceDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}. Condition: ${a.condition}.`,
      type: 'MAINTENANCE', link: '/assets', dedupeKey: `maint-${a._id}-${a.maintenanceDate.toISOString().slice(0, 10)}`,
    }, OFFICIALS);
  }
  return { meetings: meetings.length, assets: assets.length };
}

function startReminderJob() {
  const tick = () => runReminders().catch((e) => console.error('[reminders]', e.message));
  setTimeout(tick, 3000);
  return setInterval(tick, 6 * 60 * 60 * 1000);
}

module.exports = { runReminders, startReminderJob };
