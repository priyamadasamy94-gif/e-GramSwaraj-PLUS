import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, Megaphone, MessageSquareWarning, CalendarDays, HardHat, Wrench, Info } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { del, patch } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import { PageHeader, Pagination, Tabs } from '../components/ui/Misc';
import { AsyncBoundary } from '../components/ui/Feedback';
import { timeAgo, formatDate } from '../utils/format';

const ICONS = { ANNOUNCEMENT: Megaphone, GRIEVANCE: MessageSquareWarning, MEETING: CalendarDays, WORK: HardHat, MAINTENANCE: Wrench, SYSTEM: Info };

export default function Notifications() {
  const [tab, setTab] = useState('all');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const params = { page, limit: 15, ...(tab === 'unread' ? { read: 'false' } : {}), ...(type ? { type } : {}) };
  const { data, meta, loading, error, reload } = useFetch('/notifications', params);
  const { refresh } = useNotifications();
  const toast = useToast();
  const nav = useNavigate();

  const markAll = async () => { try { await patch('/notifications/read-all'); refresh(); reload(); toast.success('All notifications marked as read'); } catch (e) { toast.error(e.message); } };
  const open = async (n) => {
    if (!n.read) { try { await patch(`/notifications/${n._id}/read`); refresh(); } catch { /* ignore */ } }
    if (n.link) nav(n.link); else reload();
  };
  const remove = async (n) => { try { await del(`/notifications/${n._id}`); refresh(); reload(); } catch (e) { toast.error(e.message); } };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Notifications" subtitle={meta ? `${meta.unread} unread` : ' '} icon={Bell}
        actions={<button className="btn-secondary" onClick={markAll} disabled={!meta?.unread}><CheckCheck className="h-4 w-4" /> Mark all as read</button>} />
      <div className="flex flex-wrap items-end justify-between gap-2">
        <Tabs value={tab} onChange={(t) => { setTab(t); setPage(1); }} tabs={[{ value: 'all', label: 'All' }, { value: 'unread', label: `Unread${meta?.unread ? ` (${meta.unread})` : ''}` }]} />
        <select className="input mb-4 w-auto" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} aria-label="Filter by type">
          <option value="">All types</option>
          {Object.keys(ICONS).map((t) => <option key={t} value={t}>{t[0] + t.slice(1).toLowerCase()}</option>)}
        </select>
      </div>
      <div className="card overflow-hidden">
        <AsyncBoundary loading={loading && !data} error={error} onRetry={reload} empty={!data?.length} emptyProps={{ title: 'You are all caught up', message: 'No notifications to show.', icon: Bell }}>
          <ul className="divide-y divide-slate-100">
            {(data || []).map((n) => {
              const Icon = ICONS[n.type] || Info;
              return (
                <li key={n._id} className={`flex items-start gap-3 px-4 py-3 ${n.read ? '' : 'bg-gov-50/60'}`}>
                  <div className={`mt-0.5 rounded-full p-2 ${n.read ? 'bg-slate-100 text-slate-500' : 'bg-gov-100 text-gov-700'}`}><Icon className="h-4 w-4" /></div>
                  <button className="min-w-0 flex-1 text-left" onClick={() => open(n)}>
                    <p className={`text-sm ${n.read ? 'text-slate-700' : 'font-semibold text-slate-900'}`}>{n.title}{!n.read && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-saffron-500 align-middle" aria-label="unread" />}</p>
                    {n.message && <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>}
                    <p className="mt-1 text-xs text-slate-400" title={formatDate(n.createdAt, true)}>{timeAgo(n.createdAt)}</p>
                  </button>
                  <button className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => remove(n)} aria-label="Delete notification"><Trash2 className="h-4 w-4" /></button>
                </li>
              );
            })}
          </ul>
          <Pagination meta={meta} onPage={setPage} />
        </AsyncBoundary>
      </div>
    </div>
  );
}
