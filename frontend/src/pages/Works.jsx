import { useState } from 'react';
import { HardHat, TrendingUp, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOptions } from '../context/OptionsContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../hooks/useFetch';
import { patch } from '../services/api';
import { ResourcePage } from '../components/ui/ResourcePage';
import { StatusBadge } from '../components/ui/Badge';
import { DetailGrid, ProgressBar } from '../components/ui/Misc';
import { Modal } from '../components/ui/Modal';
import { FormModal } from '../components/ui/Form';
import { formatDate, formatINR, labelize } from '../utils/format';
import { isCitizen, isManager, isOfficial } from '../utils/roles';

const REVENUE_VILLAGES = ['South Thittankulam', 'North Thittankulam', 'Muthunagar', 'Ponthotta Colony'];

export default function Works() {
  const { user } = useAuth();
  const o = useOptions();
  const toast = useToast();
  const { t } = useLanguage();
  const tr = (key, fallback) => t(key, fallback);
  const manage = isManager(user);
  const citizen = isCitizen(user);
  const { data: officials } = useFetch(manage ? '/users/officials' : null);
  const { data: plans } = useFetch(manage ? '/plans' : null, { limit: 100, sort: 'title' });
  const [progressFor, setProgressFor] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const fields = [
    { name: 'name', label: tr('works.field.projectName', 'Project name'), required: true, span: 2 },
    { name: 'category', label: tr('category', 'Category'), type: 'select', options: o.planCategories, required: true },
    { name: 'status', label: tr('status', 'Status'), type: 'select', options: o.workStatuses, required: true, default: 'PLANNED' },
    { name: 'location', label: tr('location', 'Location') },
    { name: 'planId', label: tr('works.field.linkedPlan', 'Linked plan'), type: 'select', nullable: true, options: (plans || []).map((p) => ({ value: p._id, label: p.title })) },
    { name: 'estimatedCost', label: tr('works.field.estimatedCost', 'Estimated cost (₹)'), type: 'number', min: 0 },
    { name: 'approvedAmount', label: tr('works.field.approvedAmount', 'Approved amount (₹)'), type: 'number', min: 0 },
    { name: 'spentAmount', label: tr('works.field.spentAmount', 'Spent amount (₹)'), type: 'number', min: 0 },
    { name: 'progress', label: tr('works.field.progressPercent', 'Progress (%)'), type: 'number', min: 0, max: 100, default: 0 },
    { name: 'contractor', label: tr('works.field.contractor', 'Contractor / agency') },
    { name: 'scheme', label: tr('works.field.scheme', 'Scheme / fund source') },
    { name: 'startDate', label: tr('works.field.startDate', 'Start date'), type: 'date' },
    { name: 'expectedCompletionDate', label: tr('works.field.expectedCompletion', 'Expected completion'), type: 'date' },
    { name: 'assignedTo', label: tr('works.field.assignedTo', 'Assigned officer / staff'), type: 'select', nullable: true, options: (officials || []).map((u) => ({ value: u._id, label: `${u.name} (${labelize(u.role)})` })) },
    { name: 'actualCompletionDate', label: tr('works.field.actualCompletion', 'Actual completion'), type: 'date' },
    { name: 'description', label: tr('details', 'Description'), type: 'textarea', span: 2 },
  ];
  const progressFields = [
    { name: 'progress', label: tr('works.field.progressPercent', 'Progress (%)'), type: 'number', min: 0, max: 100, required: true },
    { name: 'status', label: tr('status', 'Status'), type: 'select', options: o.workStatuses },
    { name: 'spentAmount', label: tr('works.field.spentAmount', 'Spent amount (₹)'), type: 'number', min: 0 },
    { name: 'note', label: tr('works.field.updateNote', 'Update note'), type: 'textarea', span: 2, placeholder: tr('works.placeholder.updateNote', 'What was done since the last update?') },
  ];
  const canUpdateProgress = (r) => manage || (user.role === 'STAFF' && r.assignedTo?._id === user._id);

  const columns = [
    { key: 'name', label: tr('works.columns.activity', 'Activity / Project'), primary: true, render: (r) => (
      <div className="max-w-md">
        <div className="flex items-center gap-1.5">
          {r.activityCode && <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700 shrink-0">#{r.activityCode}</span>}
          <p className="font-medium text-slate-900">{r.name}</p>
        </div>
        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{r.description || r.location}</p>
      </div>
    )},
    { key: 'category', label: tr('category', 'Category'), render: (r) => labelize(r.category) },
    { key: 'estimatedCost', label: tr('works.columns.estimated', 'Estimated'), className: 'text-right tabular-nums', render: (r) => formatINR(r.estimatedCost) },
    { key: 'approvedAmount', label: tr('works.columns.approved', 'Approved'), className: 'text-right tabular-nums', hideOnMobile: citizen, render: (r) => formatINR(r.approvedAmount) },
    ...(!citizen ? [{ key: 'spentAmount', label: tr('works.columns.spent', 'Spent'), className: 'text-right tabular-nums', render: (r) => formatINR(r.spentAmount) }] : []),
    { key: 'progress', label: tr('progress', 'Progress'), className: 'min-w-[150px]', render: (r) => <ProgressBar value={r.progress} /> },
    { key: 'status', label: tr('status', 'Status'), render: (r) => <StatusBadge value={r.status} /> },
    { key: 'startDate', label: tr('works.columns.start', 'Start'), hideOnMobile: true, render: (r) => formatDate(r.startDate) },
    { key: 'expectedCompletionDate', label: tr('works.columns.expectedCompletion', 'Expected completion'), render: (r) => formatDate(r.expectedCompletionDate) },
  ];

  const submitProgress = async (payload) => {
    await patch(`/works/${progressFor._id}/progress`, payload);
    toast.success(tr('works.progressUpdated', 'Progress updated')); setProgressFor(null); setReloadKey((k) => k + 1);
  };

  return (
    <>
      <ResourcePage title={citizen ? tr('works.publicTitle', 'Development Works') : tr('works.managementTitle', 'Work Management')} subtitle={tr('works.subtitle', 'Village development works and their progress')} icon={HardHat}
        endpoint="/works" entityName="work" columns={columns} formFields={manage ? fields : undefined} reloadKey={reloadKey}
        filters={[
          { name: 'status', label: tr('works.filter.statuses', 'Statuses'), options: citizen ? ['APPROVED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'] : o.workStatuses },
          { name: 'category', label: tr('works.filter.categories', 'Categories'), options: o.planCategories },
          { name: 'priority', label: tr('priority', 'Risk Level / Priority'), options: [
            { value: 'CRITICAL', label: '🚨 Critical / High Risk' },
            { value: 'HIGH', label: '⚠️ High Priority' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'LOW', label: 'Low' },
          ] },
          { name: 'location', label: tr('location', 'Revenue Village / Location'), options: REVENUE_VILLAGES.map((v) => ({ value: v, label: v })) },
        ]}
        dateRange={tr('works.dateRange', 'Start date')} searchPlaceholder={tr('works.searchPlaceholder', 'Search works, locations, contractors…')}
        canCreate={manage} canEdit={manage} canDelete={manage} onRowClick={setViewing}
        extraActions={(r) => (
          <>
            <button className="btn-secondary btn-sm" onClick={() => setViewing(r)} aria-label={tr('viewDetails', 'View details')}><Eye className="h-3.5 w-3.5" /><span className="md:sr-only">{tr('view', 'View')}</span></button>
            {isOfficial(user) && canUpdateProgress(r) && <button className="btn-secondary btn-sm" onClick={() => setProgressFor(r)}><TrendingUp className="h-3.5 w-3.5" /> {tr('works.progressAction', 'Progress')}</button>}
          </>
        )}
        views={{
          progress: {
            label: tr('progress', 'Progress'),
            render: (rows) => (
              <ul className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <li key={r._id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium text-slate-800">{r.name}</p><StatusBadge value={r.status} /></div>
                    <div className="mt-2 font-mono text-xs text-gov-800" aria-hidden>{'█'.repeat(Math.round(r.progress / 6.25))}{'░'.repeat(16 - Math.round(r.progress / 6.25))} {r.progress}%</div>
                    <div className="mt-1"><ProgressBar value={r.progress} showLabel={false} size="sm" /></div>
                  </li>
                ))}
              </ul>
            ),
          },
        }}
        csv={[{ label: 'Project', value: (r) => r.name }, { label: 'Category', value: (r) => r.category }, { label: 'Location', value: (r) => r.location }, { label: 'Estimated', value: (r) => r.estimatedCost },
          { label: 'Approved', value: (r) => r.approvedAmount }, ...(!citizen ? [{ label: 'Spent', value: (r) => r.spentAmount }] : []), { label: 'Progress %', value: (r) => r.progress }, { label: 'Status', value: (r) => r.status },
          { label: 'Start', value: (r) => formatDate(r.startDate) }, { label: 'Expected completion', value: (r) => formatDate(r.expectedCompletionDate) }]} />

      <FormModal open={!!progressFor} title={`${tr('works.updateProgressTitle', 'Update progress')} — ${progressFor?.name || ''}`} fields={progressFields} item={progressFor} size="md"
        onClose={() => setProgressFor(null)} onSubmit={submitProgress} submitLabel={tr('works.updateProgressTitle', 'Update progress')} />

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.name || ''} size="lg">
        {viewing && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2"><StatusBadge value={viewing.status} /><span className="text-sm text-slate-500">{labelize(viewing.category)}</span></div>
            <ProgressBar value={viewing.progress} />
            {viewing.description && <p className="text-sm text-slate-700">{viewing.description}</p>}
            <DetailGrid items={[[tr('location', 'Location'), viewing.location], [tr('works.field.scheme', 'Scheme'), viewing.scheme], [tr('works.field.estimatedCost', 'Estimated cost'), formatINR(viewing.estimatedCost)], [tr('works.field.approvedAmount', 'Approved amount'), formatINR(viewing.approvedAmount)],
              !citizen && [tr('works.field.spentAmount', 'Spent amount'), formatINR(viewing.spentAmount)], !citizen && [tr('works.field.contractor', 'Contractor'), viewing.contractor], !citizen && [tr('works.field.assignedTo', 'Assigned to'), viewing.assignedTo?.name], !citizen && [tr('works.field.linkedPlan', 'Linked plan'), viewing.planId?.title],
              [tr('works.field.startDate', 'Start date'), formatDate(viewing.startDate)], [tr('works.field.expectedCompletion', 'Expected completion'), formatDate(viewing.expectedCompletionDate)], [tr('works.field.actualCompletion', 'Actual completion'), formatDate(viewing.actualCompletionDate)]]} />
            {!citizen && viewing.updates?.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">{tr('works.progressHistory', 'Progress history')}</h3>
                <ol className="space-y-2 border-l-2 border-slate-200 pl-4">
                  {[...viewing.updates].reverse().map((u, i) => (
                    <li key={i} className="text-sm"><span className="font-medium">{u.progress}%</span> · <StatusBadge value={u.status} /> <span className="text-xs text-slate-500">— {u.byName}, {formatDate(u.at, true)}</span>{u.note && <p className="text-slate-600">{u.note}</p>}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
