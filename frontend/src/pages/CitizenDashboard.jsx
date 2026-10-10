import { Link } from 'react-router-dom';
import { FilePlus2, Search, Megaphone, HardHat, CalendarDays, Building2, ArrowRight } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AsyncBoundary } from '../components/ui/Feedback';
import { Card, DemoNotice, ProgressBar } from '../components/ui/Misc';
import { StatusBadge } from '../components/ui/Badge';
import { formatDate, labelize } from '../utils/format';

export default function CitizenDashboard() {
  const { user, village } = useAuth();
  const { data, loading, error, reload } = useFetch('/dashboard/citizen');
  const { t } = useLanguage();
  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-xl bg-gov-800 px-5 py-6 text-white sm:px-8 sm:py-8">
        <div className="tricolor absolute inset-x-0 bottom-0 h-1" />
        <p className="text-sm text-gov-200">{t('dashboard.greeting', 'Vanakkam')}, {user.name}</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{village?.name || 'South Thittankulam'} {t('dashboard.villagePanchayat', 'Village Panchayat')}</h1>
        <p className="mt-1 text-sm text-gov-100">{village?.taluk || 'Kovilpatti'} {t('dashboard.taluk', 'Taluk')}, {village?.state || 'Tamil Nadu'} – {village?.pincode || '628502'}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/grievances/new" className="btn bg-saffron-500 text-white hover:bg-saffron-600"><FilePlus2 className="h-4 w-4" /> {t('dashboard.submitGrievance', 'Submit a grievance')}</Link>
          <Link to="/grievances/track" className="btn bg-white/10 text-white ring-1 ring-white/30 hover:bg-white/20"><Search className="h-4 w-4" /> {t('dashboard.trackGrievance', 'Track grievance')}</Link>
        </div>
      </section>
      <DemoNotice>{t('dashboard.demoNotice', 'Prototype portal — announcements, works and figures are demo content, not official records.')}</DemoNotice>
      <AsyncBoundary loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[[t('dashboard.worksInProgress', 'Works in progress'), data.counts.worksInProgress, HardHat, '/works'], [t('dashboard.worksCompleted', 'Works completed'), data.counts.worksCompleted, HardHat, '/works'],
                [t('dashboard.upcomingMeetings', 'Upcoming meetings'), data.counts.upcomingMeetings, CalendarDays, '/meetings'], [t('dashboard.myOpenGrievances', 'My open grievances'), data.counts.myOpenGrievances, Search, '/grievances/track']].map(([l, v, I, to]) => (
                <Link key={l} to={to} className="card flex items-center gap-3 p-4 hover:border-gov-300">
                  <div className="rounded-lg bg-gov-50 p-2.5"><I className="h-5 w-5 text-gov-700" /></div>
                  <div><p className="text-2xl font-semibold tabular-nums">{v}</p><p className="text-xs text-slate-500">{l}</p></div>
                </Link>
              ))}
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              <Card className="lg:col-span-2" title={<span className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-gov-700" /> {t('dashboard.villageNews', 'Village news & announcements')}</span>} actions={<Link to="/announcements" className="text-xs font-medium text-gov-700 hover:underline">{t('dashboard.viewAll', 'View all')}</Link>} bodyClass="divide-y divide-slate-100">
                {data.announcements.length ? data.announcements.map((a) => (
                  <article key={a._id} className={`px-4 py-3.5 sm:px-5 ${a.category === 'EMERGENCY' ? 'bg-red-50/60' : ''}`}>
                    <div className="flex flex-wrap items-center gap-2"><StatusBadge value={a.category} />{a.pinned && <span className="text-xs font-medium text-saffron-600">{t('announcements.pinned', 'Pinned')}</span>}<span className="text-xs text-slate-400">{formatDate(a.publishDate)}</span></div>
                    <h3 className="mt-1 font-medium text-slate-900">{a.title}</h3>
                    <p className="mt-0.5 text-sm text-slate-600">{a.description}</p>
                  </article>
                )) : <p className="p-5 text-sm text-slate-500">{t('dashboard.noAnnouncementsRightNow', 'No announcements right now.')}</p>}
              </Card>
              <div className="space-y-5">
                <Card title={t('dashboard.upcomingMeetings', 'Upcoming meetings')} bodyClass="divide-y divide-slate-100">
                  {data.meetings.length ? data.meetings.map((m) => (
                    <div key={m._id} className="px-4 py-3 sm:px-5">
                      <p className="text-sm font-medium text-slate-800">{m.title}</p>
                      <p className="text-xs text-slate-500">{formatDate(m.date, true)} · {m.location}</p>
                    </div>
                  )) : <p className="p-5 text-sm text-slate-500">{t('dashboard.noMeetingsScheduled', 'No meetings scheduled.')}</p>}
                </Card>
                <Card title={t('dashboard.myGrievances', 'My grievances')} actions={<Link to="/grievances/track" className="text-xs font-medium text-gov-700 hover:underline">{t('dashboard.track', 'Track')}</Link>} bodyClass="divide-y divide-slate-100">
                  {data.myGrievances.length ? data.myGrievances.map((g) => (
                    <Link key={g._id} to={`/grievances/track?ref=${g.referenceNumber}`} className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50 sm:px-5">
                      <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{g.subject}</p><p className="text-xs text-slate-500">{g.referenceNumber}</p></div>
                      <StatusBadge value={g.status} />
                    </Link>
                  )) : <div className="p-5 text-sm text-slate-500">{t('dashboard.noGrievancesSubmitted', 'You have not submitted any grievances.')} <Link to="/grievances/new" className="text-gov-700 hover:underline">{t('dashboard.submitOne', 'Submit one')}</Link></div>}
                </Card>
              </div>
            </div>
            <Card title={<span className="flex items-center gap-2"><HardHat className="h-4 w-4 text-gov-700" /> {t('dashboard.developmentWorks', 'Development works')}</span>} actions={<Link to="/works" className="text-xs font-medium text-gov-700 hover:underline">{t('dashboard.allWorks', 'All works')}</Link>}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.works.map((w) => (
                  <div key={w._id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-2"><p className="text-sm font-medium text-slate-800">{w.name}</p><StatusBadge value={w.status} /></div>
                    <p className="mt-0.5 text-xs text-slate-500">{labelize(w.category)} · {w.location}</p>
                    <div className="mt-3"><ProgressBar value={w.progress} /></div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title={<span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-gov-700" /> {t('dashboard.publicAssets', 'Public assets & facilities')}</span>} actions={<Link to="/assets" className="inline-flex items-center gap-1 text-xs font-medium text-gov-700 hover:underline">{t('details', 'Details')} <ArrowRight className="h-3 w-3" /></Link>}>
              <div className="flex flex-wrap gap-2">
                {data.publicAssets.map((a) => <span key={a.type} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700">{a.type} <b className="ml-1 tabular-nums">{a.count}</b></span>)}
              </div>
            </Card>
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
