import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Trash2, Download } from 'lucide-react';
import { useFetch, useDebounced } from '../../hooks/useFetch';
import { post, put, del, get } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { exportCSV } from '../../utils/export';
import { PageHeader, Pagination } from './Misc';
import { FilterBar } from './FilterBar';
import { DataTable } from './DataTable';
import { AsyncBoundary } from './Feedback';
import { FormModal } from './Form';
import { ConfirmDialog } from './Modal';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Config-driven list + CRUD page used by most modules. Filtering, search, pagination all happen on the backend.
 */
export function ResourcePage({
  title, subtitle, icon, endpoint, columns, filters, dateRange, dateFromLabel, dateToLabel, searchPlaceholder,
  formFields, canCreate, canEdit, canDelete, entityName = 'record', toFormItem,
  extraActions, headerActions, views, defaultView = 'table', onRowClick, pageSize = 10, csv, emptyState,
  beforeList, fixedQuery, deleteMessage, reloadKey, onAfterSave,
}) {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(() => ({ page: 1, limit: pageSize, ...Object.fromEntries(params.entries()) }));
  const [view, setView] = useState(defaultView);
  const [editing, setEditing] = useState(null); // null | {} (new) | item
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const { t } = useLanguage();

  const search = useDebounced(query.search || '');
  const apiParams = useMemo(() => {
    const p = { ...query, search, ...fixedQuery };
    Object.keys(p).forEach((k) => (p[k] === '' || p[k] === undefined) && delete p[k]);
    return p;
  }, [query, search, fixedQuery]);
  const { data, meta, loading, error, reload } = useFetch(endpoint, apiParams);
  useEffect(() => { if (reloadKey) reload(); }, [reloadKey]); // eslint-disable-line

  const save = async (payload) => {
    let result;
    if (editing?._id) result = await put(`${endpoint}/${editing._id}`, payload);
    else result = await post(endpoint, payload);
    toast.success(`${entityName[0].toUpperCase()}${entityName.slice(1)} ${editing?._id ? 'updated' : 'created'} successfully`);
    if (onAfterSave) onAfterSave(result?.data || payload, !editing?._id);
    setEditing(null); reload();
  };
  const remove = async () => {
    setBusy(true);
    try { await del(`${endpoint}/${deleting._id}`); toast.success(`${entityName} deleted`); setDeleting(null); reload(); }
    catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };
  const doExport = async () => {
    try {
      const res = await get(endpoint, { ...apiParams, page: 1, limit: 100 });
      exportCSV(`${title.replace(/\W+/g, '-').toLowerCase()}.csv`, csv, res.data, [`${title} — South Thittankulam`, `Exported ${new Date().toLocaleString('en-IN')}`]);
    } catch (e) { toast.error(e.message); }
  };

  const rowActions = (canEdit || canDelete || extraActions) ? (r) => (
    <div className="flex justify-end gap-1.5">
      {extraActions?.(r, reload)}
      {(typeof canEdit === 'function' ? canEdit(r) : canEdit) && <button className="btn-secondary btn-sm" onClick={() => setEditing(r)} aria-label={`${t('edit', 'Edit')} ${entityName}`}><Pencil className="h-3.5 w-3.5" /><span className="md:sr-only">{t('edit', 'Edit')}</span></button>}
      {canDelete && <button className="btn-secondary btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleting(r)} aria-label={`${t('delete', 'Delete')} ${entityName}`}><Trash2 className="h-3.5 w-3.5" /><span className="md:sr-only">{t('delete', 'Delete')}</span></button>}
    </div>
  ) : undefined;

  const rows = data || [];
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} icon={icon} actions={(
        <>
          {headerActions}
          {csv && <button className="btn-secondary" onClick={doExport}><Download className="h-4 w-4" /> {t('exportCsv', 'Export CSV')}</button>}
          {canCreate && <button className="btn-primary" onClick={() => setEditing({})}><Plus className="h-4 w-4" /> {t('add', 'Add')} {entityName}</button>}
        </>
      )} />
      {beforeList?.({ reload })}
      <div className="card overflow-hidden">
        <FilterBar query={query} setQuery={setQuery} filters={filters} dateRange={dateRange} dateFromLabel={dateFromLabel} dateToLabel={dateToLabel} searchPlaceholder={searchPlaceholder}>
          {views && (
            <div className="col-span-2 inline-flex overflow-hidden rounded-md border border-slate-300" role="group" aria-label={t('view', 'View')}>
              {[[ 'table', t('table', 'Table') ], ...Object.keys(views).map((k) => [k, views[k].label])].map(([k, l]) => (
                <button key={k} onClick={() => setView(k)} className={`px-3 py-2 text-sm ${view === k ? 'bg-gov-700 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`} aria-pressed={view === k}>{l}</button>
              ))}
            </div>
          )}
        </FilterBar>
        <AsyncBoundary loading={loading && !data} error={error} onRetry={reload} empty={!rows.length}
          emptyProps={emptyState || { title: `No ${entityName}s found`, message: query.search || Object.keys(apiParams).length > 2 ? 'No results match your filters.' : `There are no ${entityName}s yet.` }}>
          <div className={loading ? 'opacity-60 transition-opacity' : ''}>
            {view === 'table' || !views?.[view]
              ? <DataTable columns={columns} rows={rows} actions={rowActions} onRowClick={onRowClick} />
              : views[view].render(rows, { rowActions, setEditing, setDeleting, reload })}
          </div>
          <Pagination meta={meta} onPage={(p) => setQuery((q) => ({ ...q, page: p }))} />
        </AsyncBoundary>
      </div>

      {formFields && (
        <FormModal open={!!editing} title={editing?._id ? `${t('edit', 'Edit')} ${entityName}` : `${t('add', 'Add')} ${entityName}`} fields={formFields}
          item={editing && (toFormItem ? toFormItem(editing) : editing)} onClose={() => setEditing(null)} onSubmit={save} submitLabel={t('save', 'Save')} />
      )}
      <ConfirmDialog open={!!deleting} busy={busy} onCancel={() => setDeleting(null)} onConfirm={remove}
        title={`${t('delete', 'Delete')} ${entityName}?`} message={deleteMessage?.(deleting) || `This will permanently delete this ${entityName} from the database. This cannot be undone.`} />
    </div>
  );
}
