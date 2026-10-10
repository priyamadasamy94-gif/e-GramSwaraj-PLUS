import { useLanguage } from '../../context/LanguageContext';

/**
 * Responsive table: full table on md+, stacked cards on phones.
 * columns: [{ key, label, render(row), className, hideOnMobile, primary }]
 */
export function DataTable({ columns, rows, rowKey = '_id', onRowClick, actions }) {
  const { t } = useLanguage();
  const primary = columns.find((c) => c.primary) || columns[0];
  const cellVal = (c, r) => (c.render ? c.render(r) : r[c.key] ?? '—');
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((c) => <th key={c.key} scope="col" className={`table-th ${c.className || ''}`}>{c.label}</th>)}
              {actions && <th className="table-th text-right no-print"><span className="sr-only">{t('actions', 'Actions')}</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((r) => (
              <tr key={r[rowKey]} className={onRowClick ? 'cursor-pointer hover:bg-gov-50/50' : ''} onClick={onRowClick ? () => onRowClick(r) : undefined}>
                {columns.map((c) => <td key={c.key} className={`table-td ${c.className || ''}`}>{cellVal(c, r)}</td>)}
                {actions && <td className="table-td no-print whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>{actions(r)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-slate-100 md:hidden">
        {rows.map((r) => (
          <li key={r[rowKey]} className="p-4">
            <div className={onRowClick ? 'cursor-pointer' : ''} onClick={onRowClick ? () => onRowClick(r) : undefined}>
              <div className="font-medium text-slate-900">{cellVal(primary, r)}</div>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                {columns.filter((c) => c !== primary && !c.hideOnMobile).map((c) => (
                  <div key={c.key} className="min-w-0">
                    <dt className="text-[11px] uppercase tracking-wide text-slate-400">{c.label}</dt>
                    <dd className="truncate text-sm text-slate-700">{cellVal(c, r)}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {actions && <div className="mt-3 flex flex-wrap gap-2">{actions(r)}</div>}
          </li>
        ))}
      </ul>
    </>
  );
}
