import { Search, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { labelize } from '../../utils/format';

/**
 * filters: [{ name, label, options }] — rendered as selects
 * dateRange: label for from/to inputs (optional)
 */
export function FilterBar({ query, setQuery, filters = [], searchPlaceholder, dateRange, dateFromLabel = 'from', dateToLabel = 'to', children }) {
  const { t } = useLanguage();
  const set = (k, v) => setQuery((q) => ({ ...q, [k]: v, page: 1 }));
  const active = filters.some((f) => query[f.name]) || query.search || query.from || query.to;
  const placeholder = searchPlaceholder || t('search', 'Search…');

  return (
    <div className="no-print flex flex-col gap-2 border-b border-slate-100 p-3 sm:p-4 lg:flex-row lg:flex-wrap lg:items-center">
      <div className="relative min-w-0 flex-1 lg:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" aria-hidden />
        <input className="input pl-8" placeholder={placeholder} value={query.search || ''} onChange={(e) => set('search', e.target.value)} aria-label={placeholder} />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {filters.map((f) => {
          const allLabel = f.name === 'category'
            ? t('announcements.allCategories', `${t('all', 'All')} ${f.label}`)
            : f.name === 'status'
              ? t('announcements.allStatuses', `${t('all', 'All')} ${f.label}`)
              : `${t('all', 'All')} ${f.label}`;

          return (
            <select key={f.name} className="input sm:w-auto" value={query[f.name] || ''} onChange={(e) => set(f.name, e.target.value)} aria-label={f.label}>
              <option value="">{allLabel}</option>
              {(f.options || []).map((o) => {
                const val = typeof o === 'object' ? o.value : o;
                const localized = typeof o === 'object' && o.label
                  ? o.label
                  : t(`categories.${val}`, t(`statusLabels.${val}`, labelize(val)));
                return <option key={val} value={val}>{localized}</option>;
              })}
            </select>
          );
        })}
        {dateRange && (
          <>
            <label className="sr-only" htmlFor="from">{dateRange} {dateFromLabel}</label>
            <input id="from" type="date" className="input sm:w-auto" value={query.from || ''} onChange={(e) => set('from', e.target.value)} title={`${dateRange} ${dateFromLabel}`} />
            <label className="sr-only" htmlFor="to">{dateRange} {dateToLabel}</label>
            <input id="to" type="date" className="input sm:w-auto" value={query.to || ''} onChange={(e) => set('to', e.target.value)} title={`${dateRange} ${dateToLabel}`} />
          </>
        )}
        {children}
      </div>
      {active && (
        <button className="btn-ghost btn-sm self-start lg:self-auto" onClick={() => setQuery((q) => ({ page: 1, limit: q.limit }))}>
          <X className="h-3.5 w-3.5" /> {t('clear', 'Clear')}
        </button>
      )}
    </div>
  );
}
