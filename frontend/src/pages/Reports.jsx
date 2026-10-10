import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { FileBarChart, Printer, FileDown, Sheet, Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import { AsyncBoundary } from '../components/ui/Feedback';
import { Card, DemoNotice, PageHeader, ProgressBar, Tabs } from '../components/ui/Misc';
import { StatusBadge } from '../components/ui/Badge';
import { DataTable } from '../components/ui/DataTable';
import { DonutChart, CategoryBars, BudgetBars } from '../components/charts/Charts';
import { exportCSV, exportPDF } from '../utils/export';
import { formatDate, formatINR, formatINRShort, labelize } from '../utils/format';
import { isCitizen, isManager } from '../utils/roles';

function Summary({ items }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map(([l, v]) => (
        <div key={l} className="card p-3"><p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{l}</p><p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{v}</p></div>
      ))}
    </div>
  );
}

const CONFIG = {
  development: {
    title: 'Development Report', endpoint: '/reports/development',
    summary: (d) => [['Total projects', d.summary.totalProjects], ['Completed', d.summary.completed], ['In progress', d.summary.inProgress], ['Pending', d.summary.pending],
      ['Approved amount', formatINRShort(d.summary.totalApproved)], ['Spent', formatINRShort(d.summary.totalSpent)]],
    charts: (d) => [<Card key="a" title="Works by status"><DonutChart data={d.byStatus} /></Card>, <Card key="b" title="Works by category"><CategoryBars data={d.byCategory} /></Card>],
    rows: (d) => d.rows,
    columns: [
      { key: 'name', label: 'Project', primary: true, value: (r) => r.name },
      { key: 'category', label: 'Category', value: (r) => r.category },
      { key: 'status', label: 'Status', value: (r) => labelize(r.status), render: (r) => <StatusBadge value={r.status} /> },
      { key: 'progress', label: 'Progress', value: (r) => `${r.progress}%`, render: (r) => <div className="min-w-[110px]"><ProgressBar value={r.progress} size="sm" /></div> },
      { key: 'approvedAmount', label: 'Approved', value: (r) => formatINR(r.approvedAmount), className: 'text-right tabular-nums' },
      { key: 'spentAmount', label: 'Spent', value: (r) => formatINR(r.spentAmount), className: 'text-right tabular-nums' },
      { key: 'expectedCompletionDate', label: 'Expected completion', value: (r) => formatDate(r.expectedCompletionDate) },
    ],
  },
  finance: {
    title: 'Financial Report', endpoint: '/reports/finance', managerOnly: true,
    subtitle: (d) => `Financial year ${d.summary.financialYear}`,
    summary: (d) => [['Budget allocation', formatINRShort(d.summary.totalAllocation)], ['Utilised', formatINRShort(d.summary.utilizedBudget)], ['Remaining', formatINRShort(d.summary.remainingBudget)],
      ['Income', formatINRShort(d.summary.totalIncome)], ['Expenses', formatINRShort(d.summary.totalExpenses)], ['Balance', formatINRShort(d.summary.balance)]],
    charts: (d) => [<Card key="a" title="Allocation vs utilisation" className="lg:col-span-2"><BudgetBars data={d.summary.budgets} /></Card>],
    rows: (d) => d.rows,
    columns: [
      { key: 'date', label: 'Date', value: (r) => formatDate(r.date) },
      { key: 'type', label: 'Type', value: (r) => r.type, render: (r) => <StatusBadge value={r.type} /> },
      { key: 'category', label: 'Category', value: (r) => r.category },
      { key: 'description', label: 'Description', primary: true, value: (r) => r.description },
      { key: 'referenceNumber', label: 'Reference', value: (r) => r.referenceNumber },
      { key: 'amount', label: 'Amount', value: (r) => formatINR(r.amount), className: 'text-right tabular-nums' },
      { key: 'status', label: 'Status', value: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
    ],
  },
  assets: {
    title: 'Asset Report', endpoint: '/reports/assets',
    summary: (d) => [['Total assets', d.summary.totalAssets], ['Good', d.summary.good], ['Fair', d.summary.fair], ['Poor', d.summary.poor], ['Critical', d.summary.critical], ['Maintenance required', d.summary.maintenanceRequired]],
    charts: (d) => [<Card key="a" title="Condition"><DonutChart data={d.byCondition} /></Card>, <Card key="b" title="Assets by type"><CategoryBars data={d.byType} /></Card>],
    rows: (d) => d.rows,
    columns: [
      { key: 'name', label: 'Asset', primary: true, value: (r) => r.name },
      { key: 'assetCode', label: 'Code', value: (r) => r.assetCode },
      { key: 'type', label: 'Type', value: (r) => r.type },
      { key: 'location', label: 'Location', value: (r) => r.location },
      { key: 'condition', label: 'Condition', value: (r) => r.condition, render: (r) => <StatusBadge value={r.condition} /> },
      { key: 'estimatedValue', label: 'Value', value: (r) => formatINR(r.estimatedValue), className: 'text-right tabular-nums' },
      { key: 'maintenanceDate', label: 'Next maintenance', value: (r) => formatDate(r.maintenanceDate) },
    ],
  },
  grievances: {
    title: 'Grievance Report', endpoint: '/reports/grievances', managerOnly: true,
    summary: (d) => [['Total', d.summary.total], ['Pending', d.summary.pending], ['In progress', d.summary.inProgress], ['Resolved', d.summary.resolved], ['Rejected', d.summary.rejected], ['Avg. days to close', d.summary.averageResolutionDays]],
    charts: (d) => [<Card key="a" title="Status"><DonutChart data={d.byStatus} /></Card>, <Card key="b" title="By category"><CategoryBars data={d.byCategory} /></Card>],
    rows: (d) => d.rows,
    columns: [
      { key: 'referenceNumber', label: 'Reference', value: (r) => r.referenceNumber },
      { key: 'subject', label: 'Subject', primary: true, value: (r) => r.subject },
      { key: 'category', label: 'Category', value: (r) => r.category },
      { key: 'priority', label: 'Priority', value: (r) => r.priority, render: (r) => <StatusBadge value={r.priority} /> },
      { key: 'status', label: 'Status', value: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
      { key: 'assignedTo', label: 'Assigned to', value: (r) => r.assignedTo?.name || '' },
      { key: 'createdAt', label: 'Submitted', value: (r) => formatDate(r.createdAt) },
      { key: 'resolvedAt', label: 'Closed', value: (r) => formatDate(r.resolvedAt) },
    ],
  },
};

const LANG_LABELS = { hi: 'Hindi', ta: 'Tamil', te: 'Telugu', kn: 'Kannada', ml: 'Malayalam', mr: 'Marathi', bn: 'Bengali' };

function TranslationCoverageReport() {
  const { data, loading, error, reload } = useFetch('/reports/translations');
  if (loading || error) return <AsyncBoundary loading={loading} error={error} onRetry={reload}>{null}</AsyncBoundary>;
  if (!data) return null;
  const languages = Object.entries(LANG_LABELS);
  const activeLanguages = languages.filter(([code]) => data.byLanguage?.[code] > 0).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Cached translations</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{data.totalCached || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Languages with cached text</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{activeLanguages}/{languages.length}</p>
        </div>
      </div>
      <div className="card divide-y divide-slate-100">
        {languages.map(([code, label]) => (
          <div key={code} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="font-medium text-slate-800">{label}</span>
            <span className="tabular-nums text-slate-600">{data.byLanguage?.[code] || 0} cached texts</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">Translations are generated when displayed and cached separately. Original database records are not changed.</p>
    </div>
  );
}

function PublicReport() {
  const { data: d, loading, error, reload } = useFetch('/reports/public');
  return (
    <div>
      <PageHeader title="Public Report" subtitle="Transparency summary for South Thittankulam residents" icon={FileBarChart} actions={<button className="btn-secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</button>} />
      <DemoNotice />
      <AsyncBoundary loading={loading} error={error} onRetry={reload}>
        {d && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Development works</h2>
            <Summary items={[['Total', d.development.summary.totalProjects], ['Completed', d.development.summary.completed], ['In progress', d.development.summary.inProgress], ['Pending', d.development.summary.pending], ['Approved', formatINRShort(d.development.summary.totalApproved)], ['Avg. progress', `${d.development.summary.averageProgress}%`]]} />
            <div className="grid gap-5 lg:grid-cols-2"><Card title="Works by status"><DonutChart data={d.development.byStatus} /></Card><Card title="Works by category"><CategoryBars data={d.development.byCategory} /></Card></div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Grievance redressal</h2>
            <Summary items={[['Total', d.grievances.summary.total], ['Pending', d.grievances.summary.pending], ['In progress', d.grievances.summary.inProgress], ['Resolved', d.grievances.summary.resolved], ['Rejected', d.grievances.summary.rejected], ['Avg. days', d.grievances.summary.averageResolutionDays]]} />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Public assets</h2>
            <div className="grid gap-5 lg:grid-cols-2"><Card title="Assets by type"><CategoryBars data={d.assets.byType} /></Card>
              <Card title="Asset condition"><DonutChart data={['good', 'fair', 'poor', 'critical'].map((k) => ({ name: k.toUpperCase(), value: d.assets.summary[k] }))} /></Card></div>
          </div>
        )}
      </AsyncBoundary>
    </div>
  );
}

export default function Reports() {
  const { tab = 'development' } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const isAdmin = user?.role === 'ADMIN';

  if (tab === 'public' || isCitizen(user)) return <PublicReport />;

  // Special: Translation Coverage tab (admin only)
  if (tab === 'translations') {
    if (!isAdmin) return <Navigate to="/unauthorized" replace />;
    const tabs = [
      ...Object.entries(CONFIG).filter(([, c]) => !c.managerOnly || isManager(user)).map(([k, c]) => ({ value: k, label: c.title.replace(' Report', '') })),
      { value: 'translations', label: 'Translation Coverage' },
    ];
    return (
      <div>
        <PageHeader title="Reports" subtitle="South Thittankulam · generated live from the database" icon={FileBarChart}
          actions={<span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"><Languages className="h-3.5 w-3.5" /> Admin Only</span>} />
        <Tabs tabs={tabs} value={tab} onChange={(t) => nav(`/reports/${t}`)} />
        <TranslationCoverageReport />
      </div>
    );
  }

  const cfg = CONFIG[tab];
  const { data, loading, error, reload } = useFetch(cfg && !(cfg.managerOnly && !isManager(user)) ? cfg.endpoint : null);
  if (!cfg) return <Navigate to="/reports/development" replace />;
  if (cfg.managerOnly && !isManager(user)) return <Navigate to="/unauthorized" replace />;

  const tabs = [
    ...Object.entries(CONFIG).filter(([, c]) => !c.managerOnly || isManager(user)).map(([k, c]) => ({ value: k, label: c.title.replace(' Report', '') })),
    ...(isAdmin ? [{ value: 'translations', label: 'Translation Coverage' }] : []),
  ];
  const rows = data ? cfg.rows(data) : [];
  const slug = `${tab}-report-south-thittankulam`;
  const summary = data ? cfg.summary(data) : [];
  const csv = () => exportCSV(`${slug}.csv`, cfg.columns.map((c) => ({ label: c.label, value: c.value })), rows,
    [`${cfg.title} — South Thittankulam, Kovilpatti, Tamil Nadu 628502`, ...summary.map(([k, v]) => `${k}: ${v}`), 'Prototype — demo data, not official']);
  const pdf = async () => {
    setBusy(true);
    try { await exportPDF({ filename: `${slug}.pdf`, title: cfg.title, subtitle: cfg.subtitle?.(data), summary, columns: cfg.columns, rows }); }
    catch (e) { toast.error(`PDF export failed: ${e.message}`); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="South Thittankulam · generated live from the database" icon={FileBarChart} actions={data && (
        <>
          <button className="btn-secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</button>
          <button className="btn-secondary" onClick={csv}><Sheet className="h-4 w-4" /> Export CSV</button>
          <button className="btn-primary" onClick={pdf} disabled={busy}><FileDown className="h-4 w-4" /> Export PDF</button>
        </>
      )} />
      <Tabs tabs={tabs} value={tab} onChange={(t) => nav(`/reports/${t}`)} />
      <AsyncBoundary loading={loading} error={error} onRetry={reload}>
        {data && (
          <div className="space-y-5">
            <div className="hidden print:block"><h2 className="text-xl font-bold">{cfg.title} — South Thittankulam</h2><p className="text-sm">Kovilpatti, Tamil Nadu – 628502 · {new Date().toLocaleString('en-IN')}</p></div>
            <DemoNotice />
            {cfg.subtitle && <p className="text-sm font-medium text-slate-600">{cfg.subtitle(data)}</p>}
            <Summary items={summary} />
            <div className="grid gap-5 lg:grid-cols-2">{cfg.charts(data)}</div>
            <Card title={`${cfg.title} — detail (${rows.length} rows)`} bodyClass="p-0"><DataTable columns={cfg.columns.map((c) => ({ ...c, render: c.render || c.value }))} rows={rows} /></Card>
          </div>
        )}
      </AsyncBoundary>
    </div>
  );
}
