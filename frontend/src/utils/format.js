const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const num = new Intl.NumberFormat('en-IN');

export const formatINR = (v) => (v === null || v === undefined || v === '' ? '—' : inr.format(Number(v)));
/** Compact Indian units: 12,50,000 -> ₹12.5 L, 2,40,00,000 -> ₹2.4 Cr */
export function formatINRShort(v) {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(n % 1e7 === 0 ? 0 : 2).replace(/\.?0+$/, '')} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1).replace(/\.0$/, '')} L`;
  if (Math.abs(n) >= 1e3) return `₹${(n / 1e3).toFixed(1).replace(/\.0$/, '')} K`;
  return `₹${n}`;
}
export const formatNumber = (v) => (v === null || v === undefined ? '—' : num.format(v));

const LOCALE_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
};

export function formatDate(d, withTime = false) {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  let lang = 'en';
  try {
    lang = localStorage.getItem('egs_lang') || 'en';
  } catch {
    lang = 'en';
  }
  const locale = LOCALE_MAP[lang] || 'en-IN';
  return date.toLocaleString(locale, withTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
}
export function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return formatDate(d);
}
/** For <input type="date"> */
export const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
/** For <input type="datetime-local"> in local time */
export function toDateTimeInput(d) {
  if (!d) return '';
  const date = new Date(d);
  const off = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - off).toISOString().slice(0, 16);
}
/** ENUM_VALUE -> "Enum Value" */
export const labelize = (s) => (s ? String(s).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : '—');
export const ROLE_LABELS = { ADMIN: 'Administrator', PANCHAYAT_OFFICER: 'Panchayat Officer', STAFF: 'Staff', CITIZEN: 'Citizen' };
