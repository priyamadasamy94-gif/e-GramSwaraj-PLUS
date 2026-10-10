import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function PageHeader({ title, subtitle, actions, icon: Icon }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon && <div className="hidden rounded-lg bg-gov-50 p-2.5 sm:block"><Icon className="h-6 w-6 text-gov-700" aria-hidden /></div>}
        <div>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = '', bodyClass = 'p-4 sm:p-5' }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          {actions}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, icon: Icon, hint, accent = 'gov', onClick }) {
  const accents = { gov: 'bg-gov-50 text-gov-700', green: 'bg-green-50 text-green-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', violet: 'bg-violet-50 text-violet-700', slate: 'bg-slate-100 text-slate-600' };
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp onClick={onClick} className={`card flex items-start gap-3 p-4 text-left ${onClick ? 'transition hover:border-gov-300 hover:shadow' : ''}`}>
      {Icon && <div className={`rounded-lg p-2.5 ${accents[accent]}`}><Icon className="h-5 w-5" aria-hidden /></div>}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
        {hint && <p className="mt-0.5 truncate text-xs text-slate-500">{hint}</p>}
      </div>
    </Comp>
  );
}

export function ProgressBar({ value = 0, showLabel = true, size = 'md' }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const color = v >= 100 ? 'bg-green-600' : v >= 60 ? 'bg-gov-600' : v >= 30 ? 'bg-amber-500' : 'bg-orange-500';
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <div className={`flex-1 overflow-hidden rounded-full bg-slate-200 ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`}>
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${v}%` }} />
      </div>
      {showLabel && <span className="w-10 text-right text-xs font-semibold tabular-nums text-slate-700">{v}%</span>}
    </div>
  );
}

export function Pagination({ meta, onPage }) {
  const { t } = useLanguage();
  if (!meta || meta.total === 0) return null;
  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.total, meta.page * meta.limit);
  return (
    <div className="no-print flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
      <span>{t('pagination.showing', 'Showing')} <b>{from}</b> {t('pagination.to', 'to')} <b>{to}</b> {t('pagination.of', 'of')} <b>{meta.total}</b></span>
      <div className="flex items-center gap-1">
        <button className="btn-secondary btn-sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)} aria-label={t('pagination.previous', 'Previous page')}><ChevronLeft className="h-4 w-4" /></button>
        <span className="px-2 tabular-nums">{meta.page} / {meta.pages}</span>
        <button className="btn-secondary btn-sm" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)} aria-label={t('pagination.next', 'Next page')}><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export function DemoNotice({ children }) {
  return null;
}

export function DetailGrid({ items }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.filter(Boolean).map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{k}</dt>
          <dd className="mt-0.5 break-words text-sm text-slate-800">{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="no-print mb-4 flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${value === t.value ? 'border-gov-700 text-gov-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
