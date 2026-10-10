const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect, authorize } = require('../middleware/auth');
const { crudRouter } = require('./_crud');
const { ROLES, ALL_ROLES, MANAGERS, OFFICIALS } = require('../config/constants');
const { ADMIN } = ROLES;

const auth = require('../controllers/authController');
const village = require('../controllers/villageController');
const mods = require('../controllers/modules');
const works = require('../controllers/workController');
const assetX = require('../controllers/assetController');
const grv = require('../controllers/grievanceController');
const notif = require('../controllers/notificationController');
const dash = require('../controllers/dashboardController');
const reports = require('../controllers/reportController');
const users = require('../controllers/userController');
const meta = require('../controllers/metaController');
const chatbot = require('../controllers/chatbotController');
const services = require('../controllers/serviceController');

const api = express.Router();

// ---------- Public ----------
api.get('/health', meta.health);
api.get('/meta/options', meta.options);
api.get('/villages/public', village.publicInfo);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' } });

// ---------- Auth ----------
const a = express.Router();
a.post('/register', authLimiter, auth.register);
a.post('/register/send-otp', authLimiter, auth.sendOtp);
a.post('/register/verify-otp', authLimiter, auth.verifyOtp);
a.post('/register/resend-otp', authLimiter, auth.resendOtp);
a.post('/login', authLimiter, auth.login);
a.post('/google', authLimiter, auth.google);
a.get('/me', protect, auth.me);
a.put('/me', protect, auth.updateMe);
a.put('/change-password', protect, auth.changePassword);
api.use('/auth', a);

// ---------- Village ----------
const v = express.Router();
v.use(protect);
v.get('/current', village.current);
v.put('/current', authorize(ADMIN), village.updateCurrent);
v.get('/', authorize(ADMIN), village.list);
api.use('/villages', v);

// ---------- Modules ----------
api.use('/citizens', crudRouter(mods.citizens, { read: OFFICIALS, create: MANAGERS, update: MANAGERS, remove: [ADMIN] }));
api.use('/plans', crudRouter(mods.plans, { read: OFFICIALS, create: MANAGERS, update: MANAGERS, remove: MANAGERS }));

api.use('/works', crudRouter(works, { read: ALL_ROLES, create: MANAGERS, update: MANAGERS, remove: MANAGERS }, (r) => {
  r.patch('/:id/progress', authorize(OFFICIALS), works.updateProgress);
}));

api.use('/assets', crudRouter(mods.assets, { read: ALL_ROLES, create: MANAGERS, update: OFFICIALS, remove: MANAGERS }, (r) => {
  r.get('/maintenance-due', authorize(OFFICIALS), assetX.maintenanceDue);
  r.post('/:id/maintenance', authorize(OFFICIALS), assetX.logMaintenance);
  r.patch('/:id/location', authorize(OFFICIALS), assetX.updateLocation);
}));

api.use('/budgets', crudRouter(mods.budgets, { read: MANAGERS, create: [ADMIN], update: [ADMIN], remove: [ADMIN] }, (r) => {
  r.get('/summary', authorize(MANAGERS), reports.financeSummary);
  r.get('/financial-years', authorize(MANAGERS), reports.financialYears);
}));
api.use('/transactions', crudRouter(mods.transactions, { read: MANAGERS, create: [ADMIN], update: [ADMIN], remove: [ADMIN] }));
api.use('/meetings', crudRouter(mods.meetings, { read: ALL_ROLES, create: MANAGERS, update: MANAGERS, remove: MANAGERS }));
api.use('/announcements', crudRouter(mods.announcements, { read: ALL_ROLES, create: MANAGERS, update: MANAGERS, remove: MANAGERS }));

// ---------- Grievances ----------
const g = express.Router();
g.use(protect);
g.get('/', grv.list);
g.get('/track/:ref', grv.track);
g.get('/:id', grv.get);
g.post('/', grv.create);
g.patch('/:id/assign', authorize(MANAGERS), grv.assign);
g.patch('/:id/status', authorize(OFFICIALS), grv.updateStatus);
g.delete('/:id', authorize(ADMIN), grv.remove);
api.use('/grievances', g);

// ---------- Notifications ----------
const n = express.Router();
n.use(protect);
n.get('/', notif.list);
n.get('/unread-count', notif.unreadCount);
n.patch('/read-all', notif.markAllRead);
n.patch('/:id/read', notif.markRead);
n.delete('/:id', notif.remove);
api.use('/notifications', n);

// ---------- Chatbot & Services ----------
api.post('/chatbot/message', protect, chatbot.chat);
api.get('/services', protect, services.listServices);
api.get('/services/:id', protect, services.getService);
api.post('/services/request', protect, services.createServiceRequest);
api.get('/services/my-requests', protect, services.listMyServiceRequests);

// ---------- Dashboard & reports ----------
api.get('/dashboard/stats', protect, authorize(OFFICIALS), dash.admin);
api.get('/dashboard/citizen', protect, dash.citizen);

const rp = express.Router();
rp.use(protect);
rp.get('/public', reports.publicReport);
rp.get('/development', authorize(OFFICIALS), reports.development);
rp.get('/assets', authorize(OFFICIALS), reports.assets);
rp.get('/grievances', authorize(MANAGERS), reports.grievances);
rp.get('/finance', authorize(MANAGERS), reports.finance);
rp.get('/translations', authorize(ADMIN), reports.translations);
api.use('/reports', rp);

// ---------- Users ----------
const u = express.Router();
u.use(protect);
u.get('/officials', authorize(MANAGERS), users.officials);
u.get('/', authorize(ADMIN), users.list);
u.post('/', authorize(ADMIN), users.create);
u.put('/:id', authorize(ADMIN), users.update);
u.delete('/:id', authorize(ADMIN), users.remove);
api.use('/users', u);

module.exports = api;
