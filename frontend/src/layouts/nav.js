import {
  LayoutDashboard, Landmark, Info, ClipboardList, HardHat, Building2, Wallet, ArrowLeftRight, PieChart,
  CalendarDays, Users, MessageSquareWarning, Megaphone, FileBarChart, Bell, UserCog, Settings, Home, Search, FilePlus2,
} from 'lucide-react';
import { MANAGERS, OFFICIALS } from '../utils/roles';

const ADMIN = ['ADMIN'];

/** Helper returning localized nav items */
export const getAdminNav = (t = (k, f) => f || k) => [
  { label: t('nav_dashboard', 'Dashboard'), to: '/', icon: LayoutDashboard, roles: OFFICIALS, end: true },
  { group: t('group_village', 'Village'), items: [
    { label: t('nav_village_profile', 'Village Profile'), to: '/village/profile', icon: Landmark, roles: OFFICIALS },
    { label: t('nav_village_info', 'Village Information'), to: '/village/info', icon: Info, roles: OFFICIALS },
  ] },
  { group: t('group_planning', 'Planning'), items: [
    { label: t('nav_plans', 'Development Plans'), to: '/plans', icon: ClipboardList, roles: OFFICIALS },
    { label: t('nav_works', 'Works'), to: '/works', icon: HardHat, roles: OFFICIALS },
  ] },
  { group: t('group_assets', 'Assets'), items: [{ label: t('nav_assets', 'Asset Management'), to: '/assets', icon: Building2, roles: OFFICIALS }] },
  { group: t('group_finance', 'Finance'), items: [
    { label: t('nav_budget', 'Budget'), to: '/finance/budget', icon: Wallet, roles: MANAGERS },
    { label: t('nav_transactions', 'Transactions'), to: '/finance/transactions', icon: ArrowLeftRight, roles: MANAGERS },
    { label: t('nav_financial_reports', 'Financial Reports'), to: '/finance/overview', icon: PieChart, roles: MANAGERS },
  ] },
  { group: t('group_meetings', 'Meetings'), items: [{ label: t('nav_meetings', 'Gram Sabha / Meetings'), to: '/meetings', icon: CalendarDays, roles: OFFICIALS }] },
  { group: t('group_citizen_services', 'Citizen Services'), items: [
    { label: t('nav_citizens', 'Citizens'), to: '/citizens', icon: Users, roles: OFFICIALS },
    { label: t('nav_grievances', 'Grievances'), to: '/grievances', icon: MessageSquareWarning, roles: OFFICIALS },
    { label: t('nav_announcements', 'Announcements'), to: '/announcements', icon: Megaphone, roles: OFFICIALS },
  ] },
  { group: t('group_reports', 'Reports'), items: [
    { label: t('nav_plans', 'Development'), to: '/reports/development', icon: FileBarChart, roles: OFFICIALS },
    { label: t('group_finance', 'Finance'), to: '/reports/finance', icon: FileBarChart, roles: MANAGERS },
    { label: t('group_assets', 'Assets'), to: '/reports/assets', icon: FileBarChart, roles: OFFICIALS },
    { label: t('nav_grievances', 'Grievances'), to: '/reports/grievances', icon: FileBarChart, roles: MANAGERS },
  ] },
  { label: t('nav_notifications', 'Notifications'), to: '/notifications', icon: Bell, roles: OFFICIALS, badge: 'unread' },
  { label: t('nav_users', 'Users'), to: '/users', icon: UserCog, roles: ADMIN },
  { label: t('nav_settings', 'Settings'), to: '/settings', icon: Settings, roles: OFFICIALS },
];

export const getCitizenNav = (t = (k, f) => f || k) => [
  { label: t('nav_home', 'Home'), to: '/', icon: Home, end: true },
  { label: t('nav_village_profile', 'Village'), to: '/village/profile', icon: Landmark },
  { label: t('nav_announcements', 'Announcements'), to: '/announcements', icon: Megaphone },
  { label: t('nav_works', 'Works'), to: '/works', icon: HardHat },
  { label: t('nav_meetings', 'Meetings'), to: '/meetings', icon: CalendarDays },
  { label: t('nav_public_assets', 'Public Assets'), to: '/assets', icon: Building2 },
  { label: t('nav_submit_grievance', 'Submit Grievance'), to: '/grievances/new', icon: FilePlus2 },
  { label: t('nav_track_grievance', 'Track Grievance'), to: '/grievances/track', icon: Search },
  { label: t('nav_public_report', 'Public Report'), to: '/reports/public', icon: FileBarChart },
];

export const ADMIN_NAV = getAdminNav();
export const CITIZEN_NAV = getCitizenNav();
