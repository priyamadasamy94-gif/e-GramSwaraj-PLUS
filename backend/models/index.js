const bcrypt = require('bcryptjs');
const { QueryTypes } = require('sequelize');
const { DataTypes: D, sequelize, defineModel, addAssociations } = require('./_common');
const C = require('../config/constants');
const { financialYearOf } = require('../utils/query');

const str = (required = false, extra = {}) => ({ type: D.STRING, allowNull: !required, ...extra });
const text = (required = false, extra = {}) => ({ type: D.TEXT, allowNull: !required, ...extra });
const num = (extra = {}) => ({ type: D.DECIMAL(14, 2), allowNull: true, ...extra });
const date = (extra = {}) => ({ type: D.DATE, allowNull: true, ...extra });
const bool = (defaultValue = false) => ({ type: D.BOOLEAN, allowNull: false, defaultValue });
const json = (defaultValue = null) => ({ type: D.JSON, allowNull: true, defaultValue });
const village = { type: D.UUID, allowNull: false };
const user = { type: D.UUID, allowNull: true };
const enumField = (values, defaultValue, required = false) => ({
  type: D.STRING,
  allowNull: !required,
  ...(defaultValue === undefined ? {} : { defaultValue }),
  validate: { isIn: [values] },
});

const Village = defineModel('Village', {
  name: str(true), villageCode: { ...str(true), unique: true }, panchayatName: str(), block: str(),
  taluk: str(true), district: str(), state: str(true), country: str(false, { defaultValue: 'India' }),
  pincode: str(true), population: { type: D.INTEGER }, households: { type: D.INTEGER }, wards: { type: D.INTEGER },
  area: num(), latitude: { type: D.FLOAT }, longitude: { type: D.FLOAT }, locationIsApproximate: bool(true),
  description: text(), presidentName: str(), secretaryName: str(), contact: json({}), lgdCode: str(false, { defaultValue: '231907' }),
  revenueVillages: { type: D.INTEGER, defaultValue: 4 }, attractions: text(), distanceToBusStop: num(), secretary: json({}),
  demographics: json({}), basicAmenities: json({}), audit: json([]), facilities: json([]), gis: json({ boundary: null, wardBoundaries: null, source: null }),
  dataNote: text(false, { defaultValue: 'Official data sourced from eGramSwaraj portal for Thittankulam Village Panchayat (LGD: 231907).' }),
  status: enumField(['ACTIVE', 'INACTIVE'], 'ACTIVE', true), isDemo: bool(false),
}, { tableName: 'villages' });

const VillageTranslation = defineModel('VillageTranslation', {
  villageId: { type: D.UUID, allowNull: false },
  language: enumField(['en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'bn'], 'en', true),
  name: str(true), panchayatName: str(), block: str(), taluk: str(true), district: str(), state: str(true),
  description: text(), presidentName: str(), secretaryName: str(), attractions: text(), dataNote: text(),
}, { tableName: 'villageTranslations', indexes: [{ unique: true, fields: ['villageId', 'language'] }] });

const User = defineModel('User', {
  name: str(true), email: { ...str(true), unique: true, validate: { isEmail: true } },
  password: { type: D.STRING, allowNull: false, validate: { len: [8, 255] } },
  role: enumField(C.ALL_ROLES, 'CITIZEN', true), villageId: village, phone: { ...str(), unique: true }, designation: str(),
  language: enumField(['en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'bn'], 'en', false), status: enumField(C.USER_STATUSES, 'ACTIVE', true), lastLoginAt: date(), isDemo: bool(false),
}, { tableName: 'users', hiddenAttributes: ['password'] });
User.beforeSave(async (record) => {
  if (record.email) record.email = record.email.trim().toLowerCase();
  if (record.phone) record.phone = String(record.phone).replace(/\s+/g, '').trim();
  if (record.changed('password')) record.password = await bcrypt.hash(record.password, 12);
});
User.prototype.comparePassword = function compare(candidate) { return bcrypt.compare(candidate, this.password); };

const OTPVerification = defineModel('OTPVerification', {
  userIdentifier: { ...str(true), allowNull: false },
  otpHash: { type: D.STRING, allowNull: false },
  purpose: enumField(['REGISTRATION', 'LOGIN', 'PASSWORD_RESET'], 'REGISTRATION', true),
  expiresAt: date({ allowNull: false }),
  attemptCount: { type: D.INTEGER, allowNull: false, defaultValue: 0 },
  resendCount: { type: D.INTEGER, allowNull: false, defaultValue: 0 },
  verified: bool(false),
  registrationData: json({}),
  userId: user,
}, { tableName: 'otpVerifications', indexes: [{ fields: ['userIdentifier', 'purpose', 'verified', 'createdAt'] }] });

const TranslationCache = defineModel('TranslationCache', {
  sourceHash: { type: D.STRING(64), allowNull: false, unique: true },
  sourceText: { type: D.TEXT, allowNull: false },
  sourceLanguage: { type: D.STRING(8), allowNull: false },
  targetLanguage: { type: D.STRING(8), allowNull: false },
  translatedText: { type: D.TEXT, allowNull: false },
}, { tableName: 'translationCache' });

const Citizen = defineModel('Citizen', {
  villageId: village, isDemo: bool(false), name: str(true), phone: str(), email: str(), address: str(), ward: str(),
  gender: enumField(['MALE', 'FEMALE', 'OTHER', ''], ''), userId: user, status: enumField(['ACTIVE', 'INACTIVE'], 'ACTIVE', true),
}, { tableName: 'citizens' });

const DevelopmentPlan = defineModel('DevelopmentPlan', {
  villageId: village, isDemo: bool(false), title: str(true), description: text(),
  category: enumField(C.PLAN_CATEGORIES, undefined, true), priority: enumField(C.PRIORITIES, 'MEDIUM', true),
  estimatedCost: num({ defaultValue: 0 }), status: enumField(C.PLAN_STATUSES, 'PROPOSED', true),
  progress: { type: D.FLOAT, defaultValue: 0 }, financialYear: str(), ward: str(), startDate: date(), targetDate: date(), createdBy: user,
}, { tableName: 'developmentPlans', indexes: [{ fields: ['villageId', 'status', 'category'] }] });

const DevelopmentPlanTranslation = defineModel('DevelopmentPlanTranslation', {
  planId: { type: D.UUID, allowNull: false },
  language: enumField(['en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'bn'], 'en', true),
  title: str(true), description: text(),
}, { tableName: 'developmentPlanTranslations', indexes: [{ unique: true, fields: ['planId', 'language'] }] });

const Work = defineModel('Work', {
  villageId: village, isDemo: bool(false), name: str(true), activityCode: str(), workType: str(false, { defaultValue: 'New/Fresh' }),
  planYear: str(), description: text(), category: enumField(C.PLAN_CATEGORIES, undefined, true), location: str(),
  latitude: { type: D.FLOAT }, longitude: { type: D.FLOAT }, planId: user, scheme: str(), estimatedCost: num({ defaultValue: 0 }),
  approvedAmount: num({ defaultValue: 0 }), spentAmount: num({ defaultValue: 0 }), contractor: str(), startDate: date(),
  expectedCompletionDate: date(), actualCompletionDate: date(), status: enumField(C.WORK_STATUSES, 'PLANNED', true),
  progress: { type: D.FLOAT, defaultValue: 0 }, assignedTo: user, updates: json([]), createdBy: user,
}, { tableName: 'works', indexes: [{ fields: ['villageId', 'status', 'category'] }] });
Work.beforeSave((record) => {
  if (Number(record.progress) >= 100 && record.status !== 'COMPLETED') record.status = 'COMPLETED';
  if (record.status === 'COMPLETED') {
    record.progress = 100;
    if (!record.actualCompletionDate) record.actualCompletionDate = new Date();
  }
});

const WorkTranslation = defineModel('WorkTranslation', {
  workId: { type: D.UUID, allowNull: false },
  language: enumField(['en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'bn'], 'en', true),
  name: str(true), description: text(), location: str(),
}, { tableName: 'workTranslations', indexes: [{ unique: true, fields: ['workId', 'language'] }] });

const Asset = defineModel('Asset', {
  villageId: village, isDemo: bool(false), name: str(true), assetCode: str(), type: enumField(C.ASSET_TYPES, undefined, true),
  category: str(), subCategory: str(), planYear: str(), creationMode: str(), location: str(), ward: str(),
  latitude: { type: D.FLOAT, validate: { min: -90, max: 90 } }, longitude: { type: D.FLOAT, validate: { min: -180, max: 180 } }, condition: enumField(C.ASSET_CONDITIONS, 'GOOD', true),
  ownerDepartment: str(), installationDate: date(), estimatedValue: num({ defaultValue: 0 }), expenditure: num({ defaultValue: 0 }),
  maintenanceDate: date(), maintenanceIntervalDays: { type: D.INTEGER, defaultValue: 180 }, maintenanceLog: json([]),
  status: enumField(C.ASSET_STATUSES, 'ACTIVE', true), notes: text(),
}, { tableName: 'assets', indexes: [{ fields: ['villageId', 'type', 'condition'] }] });

const AssetTranslation = defineModel('AssetTranslation', {
  assetId: { type: D.UUID, allowNull: false },
  language: enumField(['en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'bn'], 'en', true),
  name: str(true), location: str(), notes: text(),
}, { tableName: 'assetTranslations', indexes: [{ unique: true, fields: ['assetId', 'language'] }] });

const FinancialTransaction = defineModel('FinancialTransaction', {
  villageId: village, isDemo: bool(false), type: enumField(C.TRANSACTION_TYPES, undefined, true), category: str(true),
  description: text(), amount: num({ allowNull: false, validate: { min: 0.01 } }), referenceNumber: str(),
  date: date({ allowNull: false, defaultValue: D.NOW }), financialYear: str(), workId: user,
  status: enumField(C.TRANSACTION_STATUSES, 'COMPLETED', true), createdBy: user,
}, { tableName: 'financialTransactions', indexes: [{ fields: ['villageId', 'financialYear', 'type'] }] });
FinancialTransaction.beforeSave((record) => {
  if (record.date) record.financialYear = financialYearOf(record.date);
});

const Budget = defineModel('Budget', {
  villageId: village, isDemo: bool(false), financialYear: str(true), category: str(true),
  allocatedAmount: num({ allowNull: false, validate: { min: 0 } }), utilizedAmount: num({ defaultValue: 0 }),
  remainingAmount: num({ defaultValue: 0 }), source: str(), notes: text(),
}, { tableName: 'budgets', indexes: [{ unique: true, fields: ['villageId', 'financialYear', 'category'] }] });
Budget.beforeSave((record) => { record.remainingAmount = Number(record.allocatedAmount || 0) - Number(record.utilizedAmount || 0); });

const Meeting = defineModel('Meeting', {
  villageId: village, isDemo: bool(false), title: str(true), type: enumField(C.MEETING_TYPES, undefined, true),
  date: date({ allowNull: false }), location: str(), agenda: json([]), minutes: text(), decisions: json([]),
  attendance: json({ total: 0, male: 0, female: 0, officials: [] }), isPublic: bool(true),
  status: enumField(C.MEETING_STATUSES, 'SCHEDULED', true), reminderSent: bool(false), createdBy: user,
}, { tableName: 'meetings' });
const MeetingTranslation = defineModel('MeetingTranslation', {
  meetingId: { type: D.UUID, allowNull: false },
  language: enumField(['en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'bn'], 'en', true),
  title: str(true), location: str(), agenda: json([]), minutes: text(), officials: json([]),
}, { tableName: 'meetingTranslations', indexes: [{ unique: true, fields: ['meetingId', 'language'] }] });

const Grievance = defineModel('Grievance', {
  villageId: village, isDemo: bool(false), referenceNumber: { ...str(), unique: true }, citizenId: { ...user, allowNull: false },
  submittedBy: user, category: enumField(C.GRIEVANCE_CATEGORIES, undefined, true), subject: str(true), description: text(true),
  location: str(), ward: str(), priority: enumField(C.PRIORITIES, 'MEDIUM', true), status: enumField(C.GRIEVANCE_STATUSES, 'SUBMITTED', true),
  assignedTo: user, resolution: text(), history: json([]), acknowledgedAt: date(), resolvedAt: date(),
}, { tableName: 'grievances', indexes: [{ fields: ['villageId', 'status', 'createdAt'] }] });

const Notification = defineModel('Notification', {
  villageId: village, isDemo: bool(false), userId: { ...user, allowNull: false }, title: str(true), message: text(),
  type: enumField(C.NOTIFICATION_TYPES, 'SYSTEM', true), link: str(), read: bool(false), dedupeKey: str(),
}, { tableName: 'notifications', indexes: [{ fields: ['userId', 'read', 'createdAt'] }, { unique: true, fields: ['userId', 'dedupeKey'] }] });

const Announcement = defineModel('Announcement', {
  villageId: village, isDemo: bool(false), title: str(true), description: text(true),
  category: enumField(C.ANNOUNCEMENT_CATEGORIES, 'PUBLIC_INFORMATION', true), publishDate: date({ defaultValue: D.NOW }),
  expiryDate: date(), status: enumField(C.ANNOUNCEMENT_STATUSES, 'PUBLISHED', true), pinned: bool(false), notified: bool(false), createdBy: user,
}, { tableName: 'announcements', indexes: [{ fields: ['villageId', 'status', 'publishDate'] }] });

const AnnouncementTranslation = defineModel('AnnouncementTranslation', {
  announcementId: { type: D.UUID, allowNull: false },
  language: enumField(['en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'bn'], 'en', true),
  title: str(true),
  description: text(true),
  categoryName: str(false),
}, { tableName: 'announcementTranslations', indexes: [{ unique: true, fields: ['announcementId', 'language'] }] });

const Service = defineModel('Service', {
  villageId: village, isDemo: bool(false), code: { ...str(true), unique: true },
  name: str(true), category: str(true), department: str(false, { defaultValue: 'Panchayat Administration' }),
  description: text(), eligibility: text(), requiredDocuments: json([]), instructions: text(),
  processingTimeDays: { type: D.INTEGER, defaultValue: 7 }, fee: num({ defaultValue: 0 }),
  status: enumField(['ACTIVE', 'INACTIVE'], 'ACTIVE', true),
}, { tableName: 'services', indexes: [{ fields: ['villageId', 'status', 'category'] }] });

const ServiceTranslation = defineModel('ServiceTranslation', {
  serviceId: { type: D.UUID, allowNull: false },
  language: enumField(['en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'bn'], 'en', true),
  name: str(true), department: str(), description: text(), eligibility: text(),
  instructions: text(), requiredDocuments: json([]),
}, { tableName: 'serviceTranslations', indexes: [{ unique: true, fields: ['serviceId', 'language'] }] });

const ServiceRequest = defineModel('ServiceRequest', {
  villageId: village, isDemo: bool(false), applicationNumber: { ...str(true), unique: true },
  serviceId: { type: D.UUID, allowNull: false }, citizenId: { type: D.UUID, allowNull: true },
  applicantName: str(true), applicantPhone: str(true), applicantEmail: str(), ward: str(), address: str(),
  details: text(), documents: json([]), priority: enumField(C.PRIORITIES, 'MEDIUM', true),
  status: enumField(['SUBMITTED', 'VERIFIED', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'COMPLETED'], 'SUBMITTED', true),
  assignedOfficer: { type: D.UUID, allowNull: true }, slaDays: { type: D.INTEGER, defaultValue: 7 }, targetDate: date(),
  remarks: text(), timeline: json([]),
}, { tableName: 'serviceRequests', indexes: [{ fields: ['villageId', 'status'] }] });

const Counter = defineModel('Counter', { _id: { type: D.STRING, primaryKey: true }, seq: { type: D.INTEGER, allowNull: false, defaultValue: 0 } }, { tableName: 'counters', timestamps: false });
Counter.next = async (key) => {
  return sequelize.transaction(async (transaction) => {
    await sequelize.query('INSERT INTO `counters` (`_id`, `seq`) VALUES (:key, LAST_INSERT_ID(1)) ON DUPLICATE KEY UPDATE `seq` = LAST_INSERT_ID(`seq` + 1)', {
      replacements: { key }, type: QueryTypes.INSERT, transaction,
    });
    const [row] = await sequelize.query('SELECT LAST_INSERT_ID() AS `seq`', {
      type: QueryTypes.SELECT, transaction,
    });
    return Number(row.seq);
  });
};

Village.hasMany(VillageTranslation, { as: 'translations', foreignKey: 'villageId', constraints: false });

DevelopmentPlan.hasMany(DevelopmentPlanTranslation, { as: 'translations', foreignKey: 'planId', constraints: false });
DevelopmentPlanTranslation.belongsTo(DevelopmentPlan, { as: 'plan', foreignKey: 'planId', constraints: false });

Work.hasMany(WorkTranslation, { as: 'translations', foreignKey: 'workId', constraints: false });
WorkTranslation.belongsTo(Work, { as: 'work', foreignKey: 'workId', constraints: false });

Asset.hasMany(AssetTranslation, { as: 'translations', foreignKey: 'assetId', constraints: false });
AssetTranslation.belongsTo(Asset, { as: 'asset', foreignKey: 'assetId', constraints: false });

Announcement.hasMany(AnnouncementTranslation, { as: 'translations', foreignKey: 'announcementId', constraints: false });
AnnouncementTranslation.belongsTo(Announcement, { as: 'announcement', foreignKey: 'announcementId', constraints: false });
Service.hasMany(ServiceTranslation, { as: 'translations', foreignKey: 'serviceId', constraints: false });
ServiceTranslation.belongsTo(Service, { as: 'service', foreignKey: 'serviceId', constraints: false });
ServiceRequest.belongsTo(Service, { as: 'service', foreignKey: 'serviceId', constraints: false });
ServiceRequest.belongsTo(Citizen, { as: 'citizen', foreignKey: 'citizenId', constraints: false });
ServiceRequest.belongsTo(User, { as: 'officer', foreignKey: 'assignedOfficer', constraints: false });
Meeting.hasMany(MeetingTranslation, { as: 'translations', foreignKey: 'meetingId', constraints: false });
MeetingTranslation.belongsTo(Meeting, { as: 'meeting', foreignKey: 'meetingId', constraints: false });

User.hasMany(OTPVerification, { as: 'otps', foreignKey: 'userId', constraints: false });
OTPVerification.belongsTo(User, { as: 'user', foreignKey: 'userId', constraints: false });

module.exports = addAssociations({
  Village, User, Citizen, OTPVerification, TranslationCache, DevelopmentPlan, Work, Asset, FinancialTransaction, Budget, Meeting, Grievance,
  MeetingTranslation, Notification, Announcement, AnnouncementTranslation, Service, ServiceTranslation, ServiceRequest, Counter,
  VillageTranslation, DevelopmentPlanTranslation, WorkTranslation, AssetTranslation
});