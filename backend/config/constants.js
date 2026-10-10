const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  PANCHAYAT_OFFICER: 'PANCHAYAT_OFFICER',
  STAFF: 'STAFF',
  CITIZEN: 'CITIZEN',
});
const ALL_ROLES = Object.values(ROLES);
const MANAGERS = [ROLES.ADMIN, ROLES.PANCHAYAT_OFFICER];
const OFFICIALS = [ROLES.ADMIN, ROLES.PANCHAYAT_OFFICER, ROLES.STAFF];

module.exports = {
  ROLES,
  ALL_ROLES,
  MANAGERS,
  OFFICIALS,
  PLAN_CATEGORIES: ['Road', 'Water', 'Sanitation', 'Education', 'Health', 'Electricity', 'Agriculture', 'Infrastructure', 'Environment', 'Other'],
  PRIORITIES: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  PLAN_STATUSES: ['PROPOSED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'],
  WORK_STATUSES: ['PLANNED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'],
  ASSET_TYPES: ['Road', 'Street Light', 'Water Tank', 'Community Hall', 'School', 'Drainage', 'Public Toilet', 'Hand Pump', 'Government Building', 'Other'],
  ASSET_CONDITIONS: ['GOOD', 'FAIR', 'POOR', 'CRITICAL'],
  ASSET_STATUSES: ['ACTIVE', 'UNDER_MAINTENANCE', 'INACTIVE', 'DECOMMISSIONED'],
  TRANSACTION_TYPES: ['INCOME', 'EXPENSE'],
  TRANSACTION_STATUSES: ['PENDING', 'COMPLETED', 'CANCELLED'],
  FINANCE_CATEGORIES: [
    'Roads & Infrastructure', 'Water Supply', 'Sanitation', 'Street Lighting', 'Education',
    'Health', 'Agriculture', 'Administration', 'Welfare', 'Other',
  ],
  INCOME_CATEGORIES: [
    'State Finance Commission Grant', 'Central Finance Commission Grant', 'House Tax',
    'Water Charges', 'MGNREGS', 'Scheme Funds', 'Other',
  ],
  MEETING_TYPES: ['GRAM_SABHA', 'PANCHAYAT_MEETING', 'COMMITTEE_MEETING'],
  MEETING_STATUSES: ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'POSTPONED'],
  GRIEVANCE_CATEGORIES: ['Water Supply', 'Roads', 'Street Lights', 'Drainage', 'Sanitation', 'Health', 'Education', 'Certificates', 'Welfare Schemes', 'Other'],
  GRIEVANCE_STATUSES: ['SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'],
  ANNOUNCEMENT_CATEGORIES: ['GOVERNMENT_NOTICE', 'GRAM_SABHA', 'DEVELOPMENT_UPDATE', 'PUBLIC_INFORMATION', 'EMERGENCY', 'EVENT'],
  ANNOUNCEMENT_STATUSES: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
  NOTIFICATION_TYPES: ['ANNOUNCEMENT', 'GRIEVANCE', 'MEETING', 'WORK', 'MAINTENANCE', 'SYSTEM'],
  USER_STATUSES: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
  REVENUE_VILLAGES: ['South Thittankulam', 'North Thittankulam', 'Muthunagar', 'Ponthotta Colony'],
};
