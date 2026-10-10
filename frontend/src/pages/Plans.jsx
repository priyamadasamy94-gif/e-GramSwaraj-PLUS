import { ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOptions } from '../context/OptionsContext';
import { ResourcePage } from '../components/ui/ResourcePage';
import { StatusBadge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/Misc';
import { formatDate, formatINR, labelize } from '../utils/format';
import { isManager } from '../utils/roles';

export default function Plans() {
  const { user } = useAuth();
  const o = useOptions();
  const manage = isManager(user);
  const fields = [
    { name: 'title', label: 'Title', required: true, span: 2 },
    { name: 'category', label: 'Category', type: 'select', options: o.planCategories, required: true },
    { name: 'priority', label: 'Priority', type: 'select', options: o.priorities, required: true, default: 'MEDIUM' },
    { name: 'status', label: 'Status', type: 'select', options: o.planStatuses, required: true, default: 'PROPOSED' },
    { name: 'progress', label: 'Progress (%)', type: 'number', min: 0, max: 100, default: 0 },
    { name: 'estimatedCost', label: 'Estimated cost (₹)', type: 'number', min: 0 },
    { name: 'financialYear', label: 'Financial year', placeholder: 'e.g. 2026-27', default: o.currentFinancialYear, pattern: /^\d{4}-\d{2}$/, patternMessage: 'Use format 2026-27' },
    { name: 'startDate', label: 'Start date', type: 'date' },
    { name: 'targetDate', label: 'Target date', type: 'date' },
    { name: 'ward', label: 'Ward(s)' },
    { name: 'description', label: 'Description', type: 'textarea', span: 2 },
  ];
  const columns = [
    { key: 'title', label: 'Plan', primary: true, render: (r) => <div><p className="font-medium text-slate-900">{r.title}</p><p className="text-xs text-slate-500">{r.ward}</p></div> },
    { key: 'category', label: 'Category', render: (r) => labelize(r.category) },
    { key: 'priority', label: 'Priority', render: (r) => <StatusBadge value={r.priority} /> },
    { key: 'estimatedCost', label: 'Est. cost', className: 'text-right tabular-nums', render: (r) => formatINR(r.estimatedCost) },
    { key: 'progress', label: 'Progress', className: 'min-w-[140px]', render: (r) => <ProgressBar value={r.progress} size="sm" /> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { key: 'targetDate', label: 'Target', hideOnMobile: true, render: (r) => formatDate(r.targetDate) },
  ];
  const views = {
    cards: {
      label: 'Cards',
      render: (rows, { rowActions }) => (
        <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <article key={r._id} className="flex flex-col rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-1.5"><StatusBadge value={r.status} /><StatusBadge value={r.priority} /><span className="text-xs text-slate-500">{labelize(r.category)}</span></div>
              <h3 className="mt-2 font-semibold text-slate-900">{r.title}</h3>
              <p className="mt-1 line-clamp-3 flex-1 text-sm text-slate-600">{r.description}</p>
              <div className="mt-3"><ProgressBar value={r.progress} /></div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>{formatINR(r.estimatedCost)}</span><span>Target {formatDate(r.targetDate)}</span></div>
              {rowActions && <div className="mt-3 border-t border-slate-100 pt-3">{rowActions(r)}</div>}
            </article>
          ))}
        </div>
      ),
    },
    progress: {
      label: 'Progress',
      render: (rows) => (
        <ul className="divide-y divide-slate-100">
          {rows.map((r) => (
            <li key={r._id} className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_1.2fr_auto] sm:items-center sm:gap-4">
              <div><p className="text-sm font-medium text-slate-800">{r.title}</p><p className="text-xs text-slate-500">{labelize(r.category)} · {formatDate(r.startDate)} → {formatDate(r.targetDate)}</p></div>
              <ProgressBar value={r.progress} />
              <StatusBadge value={r.status} />
            </li>
          ))}
        </ul>
      ),
    },
  };
  return (
    <ResourcePage title="Development Plans" subtitle="Village development planning for South Thittankulam" icon={ClipboardList}
      endpoint="/plans" entityName="plan" columns={columns} formFields={fields} views={views}
      filters={[{ name: 'category', label: 'Categories', options: o.planCategories }, { name: 'priority', label: 'Priorities', options: o.priorities }, { name: 'status', label: 'Statuses', options: o.planStatuses }]}
      dateRange="Start date" searchPlaceholder="Search plans…" canCreate={manage} canEdit={manage} canDelete={manage}
      csv={[{ label: 'Title', value: (r) => r.title }, { label: 'Category', value: (r) => r.category }, { label: 'Priority', value: (r) => r.priority }, { label: 'Status', value: (r) => r.status },
        { label: 'Progress %', value: (r) => r.progress }, { label: 'Estimated Cost', value: (r) => r.estimatedCost }, { label: 'Start', value: (r) => formatDate(r.startDate) }, { label: 'Target', value: (r) => formatDate(r.targetDate) }]} />
  );
}
