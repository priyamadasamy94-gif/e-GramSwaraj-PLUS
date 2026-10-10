import { useLanguage } from '../../context/LanguageContext';
import { labelize } from '../../utils/format';

// Status/state colours always ship with a text label (never colour alone).
const TONES = {
  green: 'bg-green-50 text-green-800 ring-green-600/25',
  blue: 'bg-blue-50 text-blue-800 ring-blue-600/25',
  amber: 'bg-amber-50 text-amber-900 ring-amber-600/30',
  orange: 'bg-orange-50 text-orange-800 ring-orange-600/25',
  red: 'bg-red-50 text-red-800 ring-red-600/25',
  slate: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  violet: 'bg-violet-50 text-violet-800 ring-violet-600/25',
  gov: 'bg-gov-50 text-gov-800 ring-gov-600/25',
};

const STATUS_TONE = {
  // works / plans
  PLANNED: 'slate', PROPOSED: 'slate', APPROVED: 'blue', IN_PROGRESS: 'amber', COMPLETED: 'green', ON_HOLD: 'orange', CANCELLED: 'red',
  // grievances
  SUBMITTED: 'slate', ACKNOWLEDGED: 'blue', RESOLVED: 'green', REJECTED: 'red',
  // assets
  GOOD: 'green', FAIR: 'amber', POOR: 'orange', CRITICAL: 'red',
  ACTIVE: 'green', UNDER_MAINTENANCE: 'amber', INACTIVE: 'slate', DECOMMISSIONED: 'red', SUSPENDED: 'red',
  // priority
  LOW: 'slate', MEDIUM: 'blue', HIGH: 'orange',
  // meetings / announcements / finance
  SCHEDULED: 'blue', POSTPONED: 'orange', PUBLISHED: 'green', DRAFT: 'slate', ARCHIVED: 'slate',
  INCOME: 'green', EXPENSE: 'red', PENDING: 'amber',
  EMERGENCY: 'red', GRAM_SABHA: 'violet', GOVERNMENT_NOTICE: 'gov', DEVELOPMENT_UPDATE: 'blue', PUBLIC_INFORMATION: 'slate', EVENT: 'amber',
  PANCHAYAT_MEETING: 'gov', COMMITTEE_MEETING: 'slate',
  ADMIN: 'violet', PANCHAYAT_OFFICER: 'gov', STAFF: 'blue', CITIZEN: 'slate',
};

export function Badge({ tone = 'slate', children, className = '' }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]} ${className}`}>{children}</span>;
}

export function StatusBadge({ value, label }) {
  if (!value) return <span className="text-slate-400">—</span>;
  const { t } = useLanguage();
  const localized = label || t(`categories.${value}`, t(`statusLabels.${value}`, labelize(value)));
  return <Badge tone={STATUS_TONE[value] || 'slate'}>{localized}</Badge>;
}
