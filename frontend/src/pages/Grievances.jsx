import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquareWarning, Eye, UserCheck, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOptions } from '../context/OptionsContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../hooks/useFetch';
import { get, patch } from '../services/api';
import { ResourcePage } from '../components/ui/ResourcePage';
import { StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { DetailGrid } from '../components/ui/Misc';
import { LoadingBlock, ErrorState, Spinner } from '../components/ui/Feedback';
import { formatDate, labelize } from '../utils/format';
import { isAdmin, isManager } from '../utils/roles';

import { WhatsAppButton } from '../components/ui/WhatsAppButton';

const STEPS = ['SUBMITTED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];

export function GrievanceStepper({ g }) {
  const reached = (s) => {
    if (g.status === 'REJECTED') return s === 'SUBMITTED' || (s === 'ACKNOWLEDGED' && g.acknowledgedAt);
    if (s === 'ASSIGNED') return !!g.assignedTo || ['IN_PROGRESS', 'RESOLVED'].includes(g.status);
    const order = ['SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'];
    return order.indexOf(g.status) >= order.indexOf(s);
  };
  return (
    <ol className="flex items-start" aria-label="Grievance progress">
      {STEPS.map((s, i) => {
        const done = reached(s);
        return (
          <li key={s} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && <span className={`absolute right-1/2 top-3.5 h-0.5 w-full ${done ? 'bg-green-600' : 'bg-slate-200'}`} aria-hidden />}
            <span className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-green-600 text-white' : 'border-2 border-slate-300 bg-white text-slate-400'}`}>{done ? <Check className="h-4 w-4" /> : i + 1}</span>
            <span className={`mt-1.5 text-[11px] leading-tight sm:text-xs ${done ? 'font-medium text-slate-800' : 'text-slate-400'}`}>{labelize(s)}</span>
          </li>
        );
      })}
      {g.status === 'REJECTED' && <li className="ml-2 self-center"><StatusBadge value="REJECTED" /></li>}
    </ol>
  );
}

export function GrievanceTimeline({ history = [] }) {
  return (
    <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
      {[...history].reverse().map((h, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-gov-600 ring-2 ring-white" aria-hidden />
          <p className="text-sm font-medium text-slate-800">{h.action}</p>
          <p className="text-xs text-slate-500">{h.byName} · {formatDate(h.at, true)}</p>
          {h.note && <p className="mt-0.5 text-sm text-slate-600">{h.note}</p>}
        </li>
      ))}
    </ol>
  );
}

const NEXT = { SUBMITTED: ['ACKNOWLEDGED', 'IN_PROGRESS', 'REJECTED'], ACKNOWLEDGED: ['IN_PROGRESS', 'RESOLVED', 'REJECTED'], IN_PROGRESS: ['RESOLVED', 'REJECTED', 'ACKNOWLEDGED'], RESOLVED: ['IN_PROGRESS'], REJECTED: ['ACKNOWLEDGED'] };

function GrievanceDetail({ id, onClose, onChanged }) {
  const { user } = useAuth();
  const toast = useToast();
  const { data: g, loading, error, reload } = useFetch(id ? `/grievances/${id}` : null);
  const { data: officials } = useFetch(isManager(user) ? '/users/officials' : null);
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [resolution, setResolution] = useState('');
  const [busy, setBusy] = useState('');
  useEffect(() => { if (g) { setAssignee(g.assignedTo?._id || ''); setStatus(''); setNote(''); setResolution(g.resolution || ''); } }, [g]);

  const canProcess = isManager(user) || (user.role === 'STAFF' && g?.assignedTo?._id === user._id);
  const act = async (kind) => {
    setBusy(kind);
    try {
      if (kind === 'assign') await patch(`/grievances/${id}/assign`, { assignedTo: assignee, note: note || undefined });
      else await patch(`/grievances/${id}/status`, { status, note: note || undefined, resolution: resolution || undefined });
      toast.success(kind === 'assign' ? 'Grievance assigned' : 'Status updated');
      reload(); onChanged();
    } catch (e) { toast.error(e.message); }
    finally { setBusy(''); }
  };

  return (
    <Modal open={!!id} onClose={onClose} title={g ? `${g.referenceNumber}` : 'Grievance'} size="lg">
      {loading && !g && <LoadingBlock />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {g && (
        <div className="space-y-5">
          <GrievanceStepper g={g} />
          <div>
            <div className="flex flex-wrap items-center gap-2"><StatusBadge value={g.status} /><StatusBadge value={g.priority} /><span className="text-xs text-slate-500">{g.category}</span></div>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">{g.subject}</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{g.description}</p>
          </div>
          <DetailGrid items={[['Citizen', g.citizenId?.name], ['Mobile', g.citizenId?.phone], ['Ward', g.ward || g.citizenId?.ward], ['Location', g.location],
            ['Submitted', formatDate(g.createdAt, true)], ['Assigned to', g.assignedTo ? `${g.assignedTo.name}${g.assignedTo.designation ? ` (${g.assignedTo.designation})` : ''}` : 'Not assigned'],
            ['Resolved / closed', formatDate(g.resolvedAt, true)], ['Resolution', g.resolution]]} />

          {g.citizenId?.phone && (
            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div className="text-xs text-emerald-900">
                <span className="font-semibold">Notify Citizen via WhatsApp Web</span>
                <p className="text-[11px] text-emerald-700">Send direct WhatsApp updates regarding Ref: {g.referenceNumber}</p>
              </div>
              <WhatsAppButton
                phone={g.citizenId.phone}
                message={`Hello ${g.citizenId?.name || 'Citizen'}, update regarding your grievance Ref: ${g.referenceNumber} (${g.subject}): Current Status is ${g.status}.${g.resolution ? ` Resolution: ${g.resolution}` : ''}`}
                label="Send WhatsApp Update"
                size="sm"
              />
            </div>
          )}

          {(isManager(user) || canProcess) && (
            <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
              {isManager(user) && (
                <div>
                  <label className="label" htmlFor="assignee">Assign to</label>
                  <div className="flex gap-2">
                    <select id="assignee" className="input" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                      <option value="">Select officer / staff</option>
                      {(officials || []).map((u) => <option key={u._id} value={u._id}>{u.name} — {u.designation || labelize(u.role)}</option>)}
                    </select>
                    <button className="btn-primary" disabled={!assignee || busy} onClick={() => act('assign')}>{busy === 'assign' ? <Spinner className="h-4 w-4 text-white" /> : <UserCheck className="h-4 w-4" />}Assign</button>
                  </div>
                </div>
              )}
              {canProcess && (
                <div>
                  <label className="label" htmlFor="newstatus">Change status</label>
                  <select id="newstatus" className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">Select next status</option>
                    {(NEXT[g.status] || []).map((s) => <option key={s} value={s}>{s === 'RESOLVED' ? 'Resolved (close complaint)' : labelize(s)}</option>)}
                  </select>
                </div>
              )}
              {canProcess && status === 'RESOLVED' && (
                <div className="md:col-span-2"><label className="label" htmlFor="resolution">Resolution <span className="text-red-600">*</span></label>
                  <textarea id="resolution" className="input" rows={2} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="What was done to resolve the complaint?" /></div>
              )}
              <div className="md:col-span-2"><label className="label" htmlFor="note">Note {status === 'REJECTED' && <span className="text-red-600">* (reason)</span>}</label>
                <textarea id="note" className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Visible in the citizen's timeline" /></div>
              {canProcess && <div className="md:col-span-2 flex justify-end"><button className="btn-primary" disabled={!status || busy} onClick={() => act('status')}>{busy === 'status' && <Spinner className="h-4 w-4 text-white" />}Update status</button></div>}
            </div>
          )}
          <div><h3 className="mb-2 text-sm font-semibold text-slate-800">Timeline</h3><GrievanceTimeline history={g.history} /></div>
        </div>
      )}
    </Modal>
  );
}

const REVENUE_VILLAGES = ['South Thittankulam', 'North Thittankulam', 'Muthunagar', 'Ponthotta Colony'];

export default function Grievances() {
  const { user } = useAuth();
  const o = useOptions();
  const [params, setParams] = useSearchParams();
  const [openId, setOpenId] = useState(params.get('open') && params.get('open') !== 'true' ? params.get('open') : null);
  const [reloadKey, setReloadKey] = useState(0);
  const [citizens, setCitizens] = useState([]);
  useEffect(() => { get('/citizens', { limit: 100, sort: 'name' }).then((r) => setCitizens(r.data)).catch(() => {}); }, []);
  const close = () => { setOpenId(null); if (params.get('open')) { params.delete('open'); setParams(params, { replace: true }); } };

  const fields = [
    { name: 'citizenId', label: 'Citizen', type: 'select', required: true, span: 2, options: citizens.map((c) => ({ value: c._id, label: `${c.name}${c.ward ? ` — ${c.ward}` : ''}` })) },
    { name: 'category', label: 'Category', type: 'select', options: o.grievanceCategories?.map((c) => ({ value: c, label: c })), required: true },
    { name: 'priority', label: 'Priority', type: 'select', options: o.priorities, default: 'MEDIUM' },
    { name: 'subject', label: 'Subject', required: true, span: 2 },
    { name: 'description', label: 'Description', type: 'textarea', required: true, span: 2 },
    { name: 'location', label: 'Location' },
    { name: 'ward', label: 'Ward' },
  ];
  const columns = [
    { key: 'referenceNumber', label: 'Reference', render: (r) => <span className="whitespace-nowrap font-mono text-xs font-medium text-gov-800">{r.referenceNumber}</span> },
    { key: 'subject', label: 'Subject', primary: true, render: (r) => <div><p className="font-medium text-slate-900">{r.subject}</p><p className="text-xs text-slate-500">{r.citizenId?.name} · {r.ward || r.citizenId?.ward || '—'}</p></div> },
    { key: 'category', label: 'Category' },
    { key: 'priority', label: 'Priority', render: (r) => <StatusBadge value={r.priority} /> },
    { key: 'assignedTo', label: 'Assigned to', hideOnMobile: true, render: (r) => r.assignedTo?.name || <span className="text-slate-400">Unassigned</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { key: 'createdAt', label: 'Submitted', render: (r) => formatDate(r.createdAt) },
  ];
  return (
    <>
      <ResourcePage title="Grievances" subtitle={user.role === 'STAFF' ? 'Grievances assigned to you' : 'Citizen grievance redressal'} icon={MessageSquareWarning}
        filters={[
          { name: 'status', label: 'Statuses', options: o.grievanceStatuses },
          { name: 'category', label: 'Categories', options: o.grievanceCategories?.map((c) => ({ value: c, label: c })) },
          { name: 'priority', label: 'Risk Level / Priority', options: [
            { value: 'CRITICAL', label: '🚨 Critical / High Risk' },
            { value: 'HIGH', label: '⚠️ High Priority' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'LOW', label: 'Low' },
          ] },
          { name: 'location', label: 'Revenue Village / Location', options: REVENUE_VILLAGES.map((v) => ({ value: v, label: v })) },
        ]}
        dateRange="Submitted" searchPlaceholder="Search reference, subject…" canCreate={isManager(user)} canDelete={isAdmin(user)} onRowClick={(r) => setOpenId(r._id)}
        extraActions={(r) => <button className="btn-secondary btn-sm" onClick={() => setOpenId(r._id)}><Eye className="h-3.5 w-3.5" /> Open</button>}
        csv={[{ label: 'Reference', value: (r) => r.referenceNumber }, { label: 'Subject', value: (r) => r.subject }, { label: 'Category', value: (r) => r.category }, { label: 'Priority', value: (r) => r.priority },
          { label: 'Status', value: (r) => r.status }, { label: 'Citizen', value: (r) => r.citizenId?.name }, { label: 'Assigned to', value: (r) => r.assignedTo?.name }, { label: 'Submitted', value: (r) => formatDate(r.createdAt) }]} />
      <GrievanceDetail id={openId} onClose={close} onChanged={() => setReloadKey((k) => k + 1)} />
    </>
  );
}
