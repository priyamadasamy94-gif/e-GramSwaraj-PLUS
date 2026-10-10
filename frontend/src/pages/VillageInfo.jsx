import { useEffect, useState } from 'react';
import { Info, Plus, Save, Trash2 } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { put } from '../services/api';
import { AsyncBoundary, Spinner } from '../components/ui/Feedback';
import { Card, DetailGrid, PageHeader } from '../components/ui/Misc';
import { FormFields, initialValues, serialize, validate } from '../components/ui/Form';
import { formatDate, formatNumber } from '../utils/format';
import { isAdmin } from '../utils/roles';

const FIELDS = [
  { name: 'name', label: 'Village name', required: true },
  { name: 'panchayatName', label: 'Panchayat name' },
  { name: 'block', label: 'Block' },
  { name: 'taluk', label: 'Taluk', required: true },
  { name: 'district', label: 'District' },
  { name: 'state', label: 'State', required: true },
  { name: 'pincode', label: 'PIN code', required: true, pattern: /^\d{6}$/, patternMessage: 'PIN code must be 6 digits' },
  { name: 'wards', label: 'Number of wards', type: 'number', min: 0 },
  { name: 'population', label: 'Population', type: 'number', min: 0 },
  { name: 'households', label: 'Households', type: 'number', min: 0 },
  { name: 'area', label: 'Area (km²)', type: 'number', min: 0, step: '0.01' },
  { name: 'presidentName', label: 'President' },
  { name: 'secretaryName', label: 'Secretary' },
  { name: 'latitude', label: 'Latitude', type: 'number', min: -90, max: 90, step: 'any' },
  { name: 'longitude', label: 'Longitude', type: 'number', min: -180, max: 180, step: 'any' },
  { name: 'locationIsApproximate', label: 'Location is approximate (show prototype label on map)', type: 'checkbox', span: 2 },
  { name: 'officeAddress', label: 'Office address', span: 2, get: (v) => v.contact?.officeAddress, set: (o, x) => { o.contact = { ...(o.contact || {}), officeAddress: x }; } },
  { name: 'phone', label: 'Office phone', get: (v) => v.contact?.phone, set: (o, x) => { o.contact = { ...(o.contact || {}), phone: x }; } },
  { name: 'email', label: 'Office email', get: (v) => v.contact?.email, set: (o, x) => { o.contact = { ...(o.contact || {}), email: x }; } },
  { name: 'officeHours', label: 'Office hours', span: 2, get: (v) => v.contact?.officeHours, set: (o, x) => { o.contact = { ...(o.contact || {}), officeHours: x }; } },
  { name: 'description', label: 'Description', type: 'textarea', span: 2, rows: 4 },
  { name: 'dataNote', label: 'Data note (shown to users)', type: 'textarea', span: 2, rows: 2 },
];

export default function VillageInfo() {
  const { user } = useAuth();
  const toast = useToast();
  const { data: v, loading, error, reload } = useFetch('/villages/current');
  const [values, setValues] = useState({});
  const [facilities, setFacilities] = useState([]);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (v) { setValues(initialValues(FIELDS, v)); setFacilities((v.facilities || []).map(({ name, type, count }) => ({ name, type, count }))); } }, [v]);
  const admin = isAdmin(user);

  const save = async (e) => {
    e.preventDefault();
    const errs = validate(FIELDS, values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const payload = serialize(FIELDS, values);
      payload.contact = { ...(v.contact || {}), ...payload.contact };
      payload.facilities = facilities.filter((f) => f.name.trim()).map((f) => ({ ...f, count: Number(f.count) || 0 }));
      await put('/villages/current', payload);
      toast.success('Village information saved'); reload();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };
  const setF = (i, k, val) => setFacilities((fs) => fs.map((f, j) => (j === i ? { ...f, [k]: val } : f)));

  return (
    <div>
      <PageHeader title="Village Information" subtitle={admin ? 'Maintain the official profile of the village' : 'Reference information about the village'} icon={Info} />
      <AsyncBoundary loading={loading} error={error} onRetry={reload}>
        {v && (admin ? (
          <form onSubmit={save} className="space-y-5" noValidate>
            <Card title="Village details"><FormFields fields={FIELDS} values={values} setValues={setValues} errors={errors} /></Card>
            <Card title="Facilities" actions={<button type="button" className="btn-secondary btn-sm" onClick={() => setFacilities((f) => [...f, { name: '', type: '', count: 1 }])}><Plus className="h-3.5 w-3.5" /> Add facility</button>}>
              <div className="space-y-2">
                {facilities.map((f, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[2fr_1fr_90px_auto]">
                    <input className="input col-span-2 sm:col-span-1" placeholder="Facility name" value={f.name} onChange={(e) => setF(i, 'name', e.target.value)} aria-label="Facility name" />
                    <input className="input" placeholder="Type" value={f.type || ''} onChange={(e) => setF(i, 'type', e.target.value)} aria-label="Facility type" />
                    <input className="input" type="number" min="0" value={f.count} onChange={(e) => setF(i, 'count', e.target.value)} aria-label="Count" />
                    <button type="button" className="btn-ghost text-red-600" onClick={() => setFacilities((fs) => fs.filter((_, j) => j !== i))} aria-label="Remove facility"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                {!facilities.length && <p className="text-sm text-slate-500">No facilities added.</p>}
              </div>
            </Card>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Last updated {formatDate(v.updatedAt, true)}</p>
              <button className="btn-primary" disabled={busy}>{busy ? <Spinner className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />} Save changes</button>
            </div>
          </form>
        ) : (
          <Card>
            <DetailGrid items={[['Village', v.name], ['Village code', v.villageCode], ['Panchayat', v.panchayatName], ['Block', v.block], ['Taluk', v.taluk], ['District', v.district],
              ['State', v.state], ['PIN code', v.pincode], ['Wards', v.wards], ['Population (demo)', formatNumber(v.population)], ['Households (demo)', formatNumber(v.households)],
              ['Area (demo)', v.area ? `${v.area} km²` : '—'], ['Coordinates', `${v.latitude}, ${v.longitude} (approx.)`], ['Office hours', v.contact?.officeHours]]} />
          </Card>
        ))}
      </AsyncBoundary>
    </div>
  );
}
