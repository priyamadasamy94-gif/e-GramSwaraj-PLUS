import { useState } from 'react';
import { Building2, Wrench, AlertTriangle, CalendarClock, MapPin, Navigation } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOptions } from '../context/OptionsContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../hooks/useFetch';
import { post, patch } from '../services/api';
import { ResourcePage } from '../components/ui/ResourcePage';
import AssetMap, { AssetLocationPicker } from '../components/AssetMap';
import { StatusBadge } from '../components/ui/Badge';
import { Card, DetailGrid } from '../components/ui/Misc';
import { Modal } from '../components/ui/Modal';
import { FormModal } from '../components/ui/Form';
import { formatDate, formatINR } from '../utils/format';
import { isCitizen, isManager, isOfficial } from '../utils/roles';

function MaintenancePanel({ reloadKey, onLog, t }) {
  const { data, loading, error, reload } = useFetch('/assets/maintenance-due', { days: 30, k: reloadKey });
  if (loading || error || !data?.length) return null;
  return (
    <Card className="mb-4 border-amber-300" title={<span className="flex items-center gap-2 text-amber-900"><CalendarClock className="h-4 w-4" /> {t('assets.maintenanceTitle', 'Maintenance reminders — next 30 days')} ({data.length})</span>}
      actions={<button className="text-xs text-slate-500 hover:underline" onClick={reload}>{t('tryAgain', 'Refresh')}</button>} bodyClass="p-0">
      <ul className="divide-y divide-slate-100">
        {data.map((a) => (
          <li key={a._id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800">{a.name}</p>
              <p className="text-xs text-slate-500">{a.type} · {a.location}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge value={a.condition} />
              <span className={`inline-flex items-center gap-1 text-xs font-medium ${a.overdue ? 'text-red-700' : 'text-amber-800'}`}>
                {a.overdue && <AlertTriangle className="h-3.5 w-3.5" aria-hidden />}
                {a.overdue ? `${t('assets.overdueBy', 'Overdue by')} ${Math.abs(a.daysLeft)} d` : `${t('assets.dueIn', 'Due in')} ${a.daysLeft} d`} ({formatDate(a.maintenanceDate)})
              </span>
              <button className="btn-secondary btn-sm" onClick={() => onLog(a)}><Wrench className="h-3.5 w-3.5" /> {t('assets.logMaintenance', 'Log')}</button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function Assets() {
  const { user } = useAuth();
  const o = useOptions();
  const toast = useToast();
  const { t, language } = useLanguage();
  const tr = (key, fallback) => t(key, fallback);
  const manage = isManager(user);
  const official = isOfficial(user);
  const citizen = isCitizen(user);
  const [logFor, setLogFor] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [locationFor, setLocationFor] = useState(null);
  const [locationPoint, setLocationPoint] = useState(null);
  const [savingLocation, setSavingLocation] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const { data: optionAssets } = useFetch('/assets', { page: 1, limit: 100, language: 'en' });
  const { data: localizedOptionAssets } = useFetch('/assets', { page: 1, limit: 100, language });
  const { data: village } = useFetch('/villages/current');
  const localizedOptionsById = new Map((localizedOptionAssets || []).map((asset) => [asset._id, asset]));
  const valuesFor = (field) => {
    const values = new Map();
    for (const asset of optionAssets || []) {
      if (asset[field] && !values.has(asset[field])) {
        values.set(asset[field], localizedOptionsById.get(asset._id)?.[field] || asset[field]);
      }
    }
    return [...values].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  };

  const fields = [
    { name: 'name', label: tr('assets.field.assetName', 'Asset name'), required: true, span: 2 },
    { name: 'type', label: tr('type', 'Type'), type: 'select', options: o.assetTypes, required: true },
    { name: 'assetCode', label: tr('assets.field.assetCode', 'Asset code') },
    { name: 'location', label: tr('location', 'Location') },
    { name: 'ward', label: tr('assets.field.ward', 'Ward') },
    { name: 'condition', label: tr('assets.field.condition', 'Condition'), type: 'select', options: o.assetConditions, required: true, default: 'GOOD' },
    { name: 'status', label: tr('status', 'Status'), type: 'select', options: o.assetStatuses, required: true, default: 'ACTIVE' },
    { name: 'ownerDepartment', label: tr('assets.field.ownerDepartment', 'Owner department') },
    { name: 'estimatedValue', label: tr('assets.field.estimatedValue', 'Estimated value (₹)'), type: 'number', min: 0 },
    { name: 'installationDate', label: tr('assets.field.installationDate', 'Installation date'), type: 'date' },
    { name: 'maintenanceDate', label: tr('assets.field.nextMaintenance', 'Next maintenance'), type: 'date' },
    { name: 'maintenanceIntervalDays', label: tr('assets.field.maintenanceInterval', 'Maintenance interval (days)'), type: 'number', min: 0, default: 180 },
    { name: 'latitude', label: tr('assets.field.latitude', 'Latitude (optional)'), type: 'number', step: 'any' },
    { name: 'longitude', label: tr('assets.field.longitude', 'Longitude (optional)'), type: 'number', step: 'any' },
    { name: 'notes', label: tr('assets.field.notes', 'Notes'), type: 'textarea', span: 2 },
  ];
  const logFields = [
    { name: 'description', label: tr('assets.field.workDone', 'Work done'), type: 'textarea', required: true, span: 2 },
    { name: 'date', label: tr('assets.field.date', 'Date'), type: 'date', required: true, get: () => new Date() },
    { name: 'cost', label: tr('assets.field.cost', 'Cost (₹)'), type: 'number', min: 0 },
    { name: 'performedBy', label: tr('assets.field.performedBy', 'Performed by') },
    { name: 'condition', label: tr('assets.field.conditionAfter', 'Condition after maintenance'), type: 'select', options: o.assetConditions },
  ];
  const columns = [
    { key: 'name', label: tr('assets.column.assetFacility', 'Asset / Facility'), primary: true, render: (r) => (
      <div>
        <div className="flex items-center gap-1.5">
          {r.assetCode && <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700">#{r.assetCode}</span>}
          <p className="font-medium text-slate-900">{r.name}</p>
        </div>
        <p className="text-xs text-slate-500">{r.subCategory || r.category || r.notes || r.location}</p>
      </div>
    )},
    { key: 'type', label: tr('type', 'Type') },
    { key: 'location', label: tr('location', 'Location'), render: (r) => `${r.location || '—'}${r.ward ? ` · ${r.ward}` : ''}` },
    { key: 'condition', label: tr('condition', 'Condition'), render: (r) => <StatusBadge value={r.condition} /> },
    { key: 'status', label: tr('status', 'Status'), render: (r) => <StatusBadge value={r.status} /> },
    ...(!citizen ? [
      { key: 'estimatedValue', label: tr('assets.column.value', 'Value'), className: 'text-right tabular-nums', hideOnMobile: true, render: (r) => formatINR(r.estimatedValue) },
      { key: 'maintenanceDate', label: tr('assets.column.nextMaintenance', 'Next maintenance'), render: (r) => {
        const overdue = r.maintenanceDate && new Date(r.maintenanceDate) < new Date();
        return <span className={overdue ? 'font-medium text-red-700' : ''}>{formatDate(r.maintenanceDate)}{overdue && ` (${tr('assets.overdue', 'overdue')})`}</span>;
      } },
    ] : []),
  ];

  const saveAssetLocation = async () => {
    if (!locationFor || !locationPoint || savingLocation) return;
    setSavingLocation(true);
    try {
      await patch(`/assets/${locationFor._id}/location`, { latitude: locationPoint[0], longitude: locationPoint[1] });
      toast.success(t('assetMap.locationSaved'));
      setLocationFor(null);
      setLocationPoint(null);
      setReloadKey((key) => key + 1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingLocation(false);
    }
  };

  const closeLocationPicker = () => {
    setLocationFor(null);
    setLocationPoint(null);
  };

  return (
    <>
      <ResourcePage title={citizen ? tr('assets.publicTitle', 'Public Assets') : tr('assets.managementTitle', 'Asset Management')} subtitle={tr('assets.subtitle', 'Roads, lights, water, buildings and other village assets')} icon={Building2}
        endpoint="/assets" entityName="asset" columns={columns} formFields={official ? fields : undefined} reloadKey={reloadKey} pageSize={100}
        filters={[{ name: 'planYear', label: t('assetMap.planYear'), options: valuesFor('planYear') }, { name: 'category', label: tr('category', 'Category'), options: valuesFor('category') },
          { name: 'subCategory', label: t('assetMap.subCategory'), options: valuesFor('subCategory') }, { name: 'status', label: tr('assets.filter.statuses', 'Statuses'), options: o.assetStatuses || [] },
          { name: 'type', label: tr('assets.filter.types', 'Types'), options: o.assetTypes || [] }, { name: 'condition', label: tr('assets.filter.conditions', 'Conditions'), options: o.assetConditions || [] }]}
        dateRange={!citizen ? tr('assets.dateRange', 'Maintenance date') : undefined} searchPlaceholder={tr('assets.searchPlaceholder', 'Search assets…')}
        views={{ map: { label: t('assetMap.mapView'), render: (rows) => <AssetMap assets={rows} village={village} canSetLocation={official} onSetLocation={(asset) => { setLocationFor(asset); setLocationPoint(null); }} onViewDetails={setViewing} /> } }}
        canCreate={manage} canEdit={official} canDelete={manage} onRowClick={setViewing}
        beforeList={() => official && <MaintenancePanel reloadKey={reloadKey} onLog={setLogFor} t={t} />}
        extraActions={official ? (r) => <button className="btn-secondary btn-sm" onClick={() => setLogFor(r)}><Wrench className="h-3.5 w-3.5" /> {tr('assets.maintenanceAction', 'Maintenance')}</button> : undefined}
        csv={!citizen && [{ label: tr('assets.csv.asset', 'Asset'), value: (r) => r.name }, { label: tr('assets.csv.code', 'Code'), value: (r) => r.assetCode }, { label: tr('type', 'Type'), value: (r) => r.type }, { label: tr('location', 'Location'), value: (r) => r.location },
          { label: tr('assets.field.condition', 'Condition'), value: (r) => r.condition }, { label: tr('status', 'Status'), value: (r) => r.status }, { label: tr('assets.column.value', 'Value'), value: (r) => r.estimatedValue }, { label: tr('assets.column.nextMaintenance', 'Next maintenance'), value: (r) => formatDate(r.maintenanceDate) }]} />

      <FormModal open={!!logFor} title={`${tr('assets.recordMaintenance', 'Record maintenance')} — ${logFor?.name || ''}`} fields={logFields} item={{}} size="md" submitLabel={tr('assets.saveRecord', 'Save record')}
        onClose={() => setLogFor(null)}
        onSubmit={async (payload) => { await post(`/assets/${logFor._id}/maintenance`, payload); toast.success(tr('assets.maintenanceRecorded', 'Maintenance recorded; next date scheduled')); setLogFor(null); setReloadKey((k) => k + 1); }} />

      <Modal open={!!locationFor} onClose={closeLocationPicker} title={`${t('assetMap.setLocation')} — ${locationFor?.name || ''}`} size="xl" footer={(
        <>
          <button type="button" className="btn-secondary" onClick={closeLocationPicker} disabled={savingLocation}>{t('cancel')}</button>
          <button type="button" className="btn-primary" onClick={saveAssetLocation} disabled={!locationPoint || savingLocation}>
            {savingLocation ? t('loading') : t('assetMap.confirmPoint')}
          </button>
        </>
      )}>
        <AssetLocationPicker village={village} point={locationPoint} onPointChange={setLocationPoint} />
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.name || ''} size="lg">
        {viewing && (
          <div className="space-y-5">
            <div className="flex gap-2"><StatusBadge value={viewing.condition} /><StatusBadge value={viewing.status} /></div>
            <DetailGrid items={[[tr('type', 'Type'), viewing.type], [tr('assets.field.assetCode', 'Code'), viewing.assetCode], [t('assetMap.planYear'), viewing.planYear], [tr('location', 'Location'), viewing.location], [tr('assets.field.ward', 'Ward'), viewing.ward],
              [tr('category', 'Category'), viewing.category], [t('assetMap.subCategory'), viewing.subCategory], [t('assetMap.expenditure', 'Expenditure'), formatINR(viewing.expenditure)],
              [t('assetMap.locationStatus', 'Location'), viewing.latitude != null && viewing.longitude != null
                ? <span className="inline-flex items-center gap-1 text-green-700 font-medium"><MapPin className="h-3.5 w-3.5" /> {t('assetMap.locationAvailable', 'Available')}</span>
                : <span className="inline-flex items-center gap-1 text-amber-600 font-medium">{t('assetMap.locationNotAvailable', 'Not available')}</span>],
              !citizen && [tr('assets.field.ownerDepartment', 'Owner department'), viewing.ownerDepartment], !citizen && [tr('assets.field.estimatedValue', 'Estimated value'), formatINR(viewing.estimatedValue)],
              !citizen && [tr('assets.field.installationDate', 'Installed'), formatDate(viewing.installationDate)], !citizen && [tr('assets.field.nextMaintenance', 'Next maintenance'), formatDate(viewing.maintenanceDate)],
              !citizen && [tr('assets.field.interval', 'Interval'), viewing.maintenanceIntervalDays ? `${viewing.maintenanceIntervalDays} ${tr('assets.days', 'days')}` : '—'], !citizen && [tr('assets.field.notes', 'Notes'), viewing.notes]]} />

            {/* Interactive GIS Location Map */}
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                <MapPin className="h-4 w-4 text-red-600" /> {t('assetMap.gisLocationMap', 'GIS Location Map')}
              </h3>
              {viewing.latitude != null && viewing.longitude != null ? (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <AssetMap assets={[viewing]} village={village} canSetLocation={official} onSetLocation={(asset) => { setViewing(null); setLocationFor(asset); setLocationPoint(null); }} />
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                  <p className="font-medium">{t('assetMap.noExactLocations', 'Exact GPS coordinates not pinned yet.')}</p>
                  <p className="mt-1">{t('assetMap.noExactLocationsHint', 'Officials can pin the exact location on the map.')}</p>
                </div>
              )}
            </div>

            {/* Map Actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              {viewing.latitude != null && viewing.longitude != null && (
                <>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${viewing.latitude},${viewing.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary btn-sm inline-flex items-center gap-1.5 no-underline"
                    style={{ textDecoration: 'none' }}
                  >
                    <MapPin className="h-3.5 w-3.5 text-red-600" /> {t('assetMap.openGoogleMaps', 'Open in Google Maps')}
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${viewing.latitude},${viewing.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary btn-sm inline-flex items-center gap-1.5 no-underline"
                    style={{ textDecoration: 'none' }}
                  >
                    <Navigation className="h-3.5 w-3.5 text-blue-600" /> {t('assetMap.getDirections', 'Get Directions')}
                  </a>
                </>
              )}
              {official && (
                <button
                  type="button"
                  className="btn-secondary btn-sm inline-flex items-center gap-1.5"
                  onClick={() => { setViewing(null); setLocationFor(viewing); setLocationPoint(null); }}
                >
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" /> {viewing.latitude != null ? t('assetMap.updateLocation', 'Update Location') : t('assetMap.setLocation', 'Set Location')}
                </button>
              )}
            </div>

            {!citizen && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">{tr('assets.history', 'Maintenance history')}</h3>
                {viewing.maintenanceLog?.length ? (
                  <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
                    {[...viewing.maintenanceLog].reverse().map((m) => <li key={m._id} className="px-3 py-2 text-sm"><b>{formatDate(m.date)}</b> — {m.description} <span className="text-slate-500">({formatINR(m.cost)}{m.performedBy ? `, ${m.performedBy}` : ''})</span></li>)}
                  </ul>
                ) : <p className="text-sm text-slate-500">{tr('assets.noHistory', 'No maintenance recorded yet.')}</p>}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
