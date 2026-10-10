import { Link, useNavigate } from 'react-router-dom';
import {
  HardHat, Activity, CheckCircle2, Building2, MessageSquareWarning, BadgeCheck, Wallet, TrendingUp, CalendarDays, Megaphone, Wrench, Users,
} from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AsyncBoundary } from '../components/ui/Feedback';
import { Card, DemoNotice, PageHeader, ProgressBar, StatCard } from '../components/ui/Misc';
import { StatusBadge } from '../components/ui/Badge';
import { DonutChart, CategoryBars, BudgetBars } from '../components/charts/Charts';
import { formatDate, formatINRShort, labelize, timeAgo } from '../utils/format';
import { isManager } from '../utils/roles';

export default function Dashboard() {
  const { data, loading, error, reload } = useFetch('/dashboard/stats');
  const { user } = useAuth();
  const { t } = useLanguage();
  const nav = useNavigate();
  const c = data?.cards;
  return (
    <div>
      <PageHeader title={t('dashboard.title', 'South Thittankulam Dashboard')} subtitle={t('dashboard.welcome', 'Welcome, {{name}}. Live figures from the village database.').replace('{{name}}', user?.name || '')} />
      <DemoNotice />
      <AsyncBoundary loading={loading} error={error} onRetry={reload}>
        {data && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              <StatCard label={t('dashboard.developmentWorks', 'Development Works')} value={c.totalWorks} icon={HardHat} onClick={() => nav('/works')} />
              <StatCard label={t('dashboard.activeWorks', 'Active Works')} value={c.activeWorks} icon={Activity} accent="amber" onClick={() => nav('/works?status=IN_PROGRESS')} />
              <StatCard label={t('dashboard.completedWorks', 'Completed Works')} value={c.completedWorks} icon={CheckCircle2} accent="green" onClick={() => nav('/works?status=COMPLETED')} />
              <StatCard label={t('dashboard.villageAssets', 'Village Assets')} value={c.totalAssets} icon={Building2} hint={c.maintenanceDue ? `${c.maintenanceDue} ${t('dashboard.dueForMaintenance', 'due for maintenance')}` : undefined} onClick={() => nav('/assets')} />
              <StatCard label={t('dashboard.pendingGrievances', 'Pending Grievances')} value={c.pendingGrievances} icon={MessageSquareWarning} accent="red" onClick={() => nav('/grievances?open=true')} />
              <StatCard label={t('dashboard.resolvedGrievances', 'Resolved Grievances')} value={c.resolvedGrievances} icon={BadgeCheck} accent="green" onClick={() => nav('/grievances?status=RESOLVED')} />
              <StatCard label={t('dashboard.totalBudget', 'Total Budget')} value={formatINRShort(c.totalBudget)} icon={Wallet} hint={`FY ${data.finance.financialYear}`} onClick={isManager(user) ? () => nav('/finance/budget') : undefined} />
              <StatCard label={t('dashboard.budgetUtilised', 'Budget Utilised')} value={formatINRShort(c.budgetUtilized)} icon={TrendingUp} accent="violet" hint={`${data.finance.utilizationPercent}% ${t('dashboard.ofAllocation', 'of allocation')}`} onClick={isManager(user) ? () => nav('/finance/overview') : undefined} />
              <StatCard label={t('dashboard.upcomingMeetings', 'Upcoming Meetings')} value={c.upcomingMeetings} icon={CalendarDays} onClick={() => nav('/meetings')} />
              <StatCard label={t('announcements.title', 'Announcements')} value={c.announcements} icon={Megaphone} accent="amber" hint={t('dashboard.currentlyPublished', 'Currently published')} onClick={() => nav('/announcements')} />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card title={t('dashboard.workStatus', 'Work status')}><DonutChart data={data.charts.workStatus} /></Card>
              <Card title={t('dashboard.grievanceStatus', 'Grievance status')}><DonutChart data={data.charts.grievanceStatus} /></Card>
            </div>
            <Card title={`${t('dashboard.budgetAllocationUtilisation', 'Budget allocation vs utilisation')} — FY ${data.finance.financialYear}`} actions={isManager(user) && <Link to="/finance/overview" className="text-xs font-medium text-gov-700 hover:underline">{t('dashboard.financeDetails', 'Finance details')} →</Link>}>
              <BudgetBars data={data.charts.budget} />
            </Card>
            <div className="grid gap-5 lg:grid-cols-3">
              <Card title={t('dashboard.assetCondition', 'Asset condition')}><DonutChart data={data.charts.assetCondition} height={200} /></Card>
              <Card title={t('dashboard.worksByCategory', 'Works by category')}><CategoryBars data={data.charts.workCategories} /></Card>
              <Card title={t('dashboard.plansByCategory', 'Development plans by category')}><CategoryBars data={data.charts.planCategories} color="#1baf7a" /></Card>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card title={t('dashboard.worksInProgress', 'Works in progress')} actions={<Link to="/works" className="text-xs font-medium text-gov-700 hover:underline">{t('dashboard.allWorks', 'All works')} →</Link>} bodyClass="divide-y divide-slate-100">
                {data.activeWorks.length ? data.activeWorks.map((w) => (
                  <div key={w._id} className="px-4 py-3 sm:px-5">
                    <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium text-slate-800">{w.name}</p><span className="shrink-0 text-xs text-slate-500">{labelize(w.category)}</span></div>
                    <div className="mt-1.5"><ProgressBar value={w.progress} /></div>
                  </div>
                )) : <p className="p-5 text-sm text-slate-500">{t('dashboard.noWorksInProgress', 'No works in progress.')}</p>}
              </Card>
              <Card title={t('dashboard.recentGrievances', 'Recent grievances')} actions={<Link to="/grievances" className="text-xs font-medium text-gov-700 hover:underline">{t('dashboard.allGrievances', 'All grievances')} →</Link>} bodyClass="divide-y divide-slate-100">
                {data.recentGrievances.length ? data.recentGrievances.map((g) => (
                  <Link key={g._id} to={`/grievances?open=${g._id}`} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-slate-50 sm:px-5">
                    <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{g.subject}</p><p className="text-xs text-slate-500">{g.referenceNumber} · {g.citizenId?.name} · {timeAgo(g.createdAt)}</p></div>
                    <StatusBadge value={g.status} />
                  </Link>
                )) : <p className="p-5 text-sm text-slate-500">{t('dashboard.noGrievancesYet', 'No grievances yet.')}</p>}
              </Card>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card title={t('nav_meetings', 'Upcoming meetings')} bodyClass="divide-y divide-slate-100">
                {data.upcomingMeetings.length ? data.upcomingMeetings.map((m) => (
                  <div key={m._id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <div className="w-12 shrink-0 rounded-md bg-gov-50 py-1 text-center"><p className="text-[10px] font-semibold uppercase text-gov-600">{new Date(m.date).toLocaleString('en-IN', { month: 'short' })}</p><p className="text-lg font-bold leading-none text-gov-800">{new Date(m.date).getDate()}</p></div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-800">{m.title}</p><p className="text-xs text-slate-500">{formatDate(m.date, true)} · {m.location}</p></div>
                    <StatusBadge value={m.type} />
                  </div>
                )) : <p className="p-5 text-sm text-slate-500">{t('dashboard.noUpcomingMeetings', 'No upcoming meetings.')}</p>}
              </Card>
              <Card title={t('dashboard.latestAnnouncements', 'Latest announcements')} bodyClass="divide-y divide-slate-100">
                {data.latestAnnouncements.length ? data.latestAnnouncements.map((a) => (
                  <div key={a._id} className="px-4 py-3 sm:px-5">
                    <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium text-slate-800">{a.title}</p><StatusBadge value={a.category} /></div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{a.description}</p>
                  </div>
                )) : <p className="p-5 text-sm text-slate-500">{t('dashboard.noAnnouncements', 'No announcements.')}</p>}
              </Card>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label={t('dashboard.registeredCitizens', 'Registered citizens')} value={c.citizens} icon={Users} accent="slate" onClick={() => nav('/citizens')} />
              <StatCard label={t('dashboard.maintenanceDue', 'Maintenance due (30 d)')} value={c.maintenanceDue} icon={Wrench} accent={c.maintenanceDue ? 'red' : 'green'} onClick={() => nav('/assets?due=1')} />
              <StatCard label={t('dashboard.totalIncome', 'Total income (FY)')} value={formatINRShort(data.finance.totalIncome)} icon={TrendingUp} accent="green" />
              <StatCard label={t('dashboard.totalExpenses', 'Total expenses (FY)')} value={formatINRShort(data.finance.totalExpenses)} icon={Wallet} accent="amber" />
            </div>
          </div>
        )}
      </AsyncBoundary>
    </div>
  );
}
