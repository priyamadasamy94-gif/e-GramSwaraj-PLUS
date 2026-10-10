export const ROLES = { ADMIN: 'ADMIN', OFFICER: 'PANCHAYAT_OFFICER', STAFF: 'STAFF', CITIZEN: 'CITIZEN' };
export const MANAGERS = [ROLES.ADMIN, ROLES.OFFICER];
export const OFFICIALS = [ROLES.ADMIN, ROLES.OFFICER, ROLES.STAFF];
export const hasRole = (user, roles) => !!user && roles.includes(user.role);
export const isManager = (user) => hasRole(user, MANAGERS);
export const isOfficial = (user) => hasRole(user, OFFICIALS);
export const isAdmin = (user) => user?.role === ROLES.ADMIN;
export const isCitizen = (user) => user?.role === ROLES.CITIZEN;
