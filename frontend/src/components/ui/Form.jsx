import { useEffect, useState } from 'react';
import { labelize, toDateInput, toDateTimeInput } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';
import { Modal } from './Modal';
import { Spinner } from './Feedback';

/**
 * Field config:
 * { name, label, type: text|email|password|number|select|date|datetime|textarea|checkbox|list,
 *   options: [..] | [{value,label}], required, min, max, step, placeholder, span: 2, help, hidden(values) }
 */
const optionList = (opts = []) => opts.map((o) => (typeof o === 'object' ? o : { value: o, label: labelize(o) }));

export function initialValues(fields, item = {}) {
  const v = {};
  for (const f of fields) {
    const raw = f.get ? f.get(item) : item?.[f.name];
    if (f.type === 'date') v[f.name] = toDateInput(raw);
    else if (f.type === 'datetime') v[f.name] = toDateTimeInput(raw);
    else if (f.type === 'list') v[f.name] = Array.isArray(raw) ? raw.join('\n') : raw || '';
    else if (f.type === 'checkbox') v[f.name] = raw ?? f.default ?? false;
    else if (raw && typeof raw === 'object' && raw._id) v[f.name] = raw._id;
    else v[f.name] = raw ?? f.default ?? '';
  }
  return v;
}

export function serialize(fields, values) {
  const out = {};
  for (const f of fields) {
    if (f.hidden?.(values) || f.readOnly) continue;
    let v = values[f.name];
    if (f.type === 'number') v = v === '' || v === null ? undefined : Number(v);
    else if (f.type === 'list') v = String(v || '').split('\n').map((s) => s.trim()).filter(Boolean);
    else if (f.type === 'date' || f.type === 'datetime') v = v ? new Date(v).toISOString() : null;
    else if (f.type === 'select' && v === '') v = f.nullable ? null : undefined;
    if (v === undefined) continue;
    if (f.set) f.set(out, v); else out[f.name] = v;
  }
  return out;
}

export function validate(fields, values) {
  const errors = {};
  for (const f of fields) {
    if (f.hidden?.(values)) continue;
    const v = values[f.name];
    if (f.required && (v === '' || v === null || v === undefined)) errors[f.name] = `${f.label} is required`;
    else if (f.type === 'number' && v !== '' && v !== undefined) {
      const n = Number(v);
      if (Number.isNaN(n)) errors[f.name] = 'Enter a valid number';
      else if (f.min !== undefined && n < f.min) errors[f.name] = `Minimum is ${f.min}`;
      else if (f.max !== undefined && n > f.max) errors[f.name] = `Maximum is ${f.max}`;
    } else if (f.type === 'email' && v && !/^\S+@\S+\.\S+$/.test(v)) errors[f.name] = 'Enter a valid email';
    else if (f.minLength && v && String(v).length < f.minLength) errors[f.name] = `At least ${f.minLength} characters`;
    else if (f.pattern && v && !f.pattern.test(v)) errors[f.name] = f.patternMessage || 'Invalid format';
  }
  return errors;
}

export function Field({ field: f, value, onChange, error }) {
  const id = `f-${f.name}`;
  const common = { id, name: f.name, 'aria-invalid': !!error, 'aria-describedby': error ? `${id}-err` : undefined, disabled: f.readOnly };
  let control;
  if (f.type === 'select') {
    control = (
      <select {...common} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">{f.placeholder || `Select ${f.label.toLowerCase()}`}</option>
        {optionList(f.options).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  } else if (f.type === 'textarea' || f.type === 'list') {
    control = <textarea {...common} rows={f.rows || 3} className="input" value={value ?? ''} placeholder={f.type === 'list' ? 'One item per line' : f.placeholder} onChange={(e) => onChange(e.target.value)} />;
  } else if (f.type === 'checkbox') {
    return (
      <label className={`flex items-center gap-2 text-sm text-slate-700 ${f.span === 2 ? 'sm:col-span-2' : ''}`}>
        <input type="checkbox" {...common} className="h-4 w-4 rounded border-slate-300 text-gov-700" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        {f.label}
      </label>
    );
  } else {
    const type = f.type === 'datetime' ? 'datetime-local' : f.type || 'text';
    control = <input {...common} type={type} className="input" value={value ?? ''} min={f.min} max={f.max} step={f.step} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} autoComplete={f.autoComplete} />;
  }
  return (
    <div className={f.span === 2 ? 'sm:col-span-2' : ''}>
      <label htmlFor={id} className="label">{f.label}{f.required && <span className="text-red-600"> *</span>}</label>
      {control}
      {f.help && !error && <p className="mt-1 text-xs text-slate-500">{f.help}</p>}
      {error && <p id={`${id}-err`} className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function FormFields({ fields, values, setValues, errors }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.filter((f) => !f.hidden?.(values)).map((f) => (
        <Field key={f.name} field={f} value={values[f.name]} error={errors[f.name]} onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))} />
      ))}
    </div>
  );
}

/** Modal with a config-driven form. onSubmit receives the serialized payload. */
export function FormModal({ open, title, fields, item, onClose, onSubmit, submitLabel = 'Save', size = 'lg' }) {
  const { t } = useLanguage();
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');
  useEffect(() => { if (open) { setValues(initialValues(fields, item || {})); setErrors({}); setServerError(''); } }, [open, item]); // eslint-disable-line

  const submit = async (e) => {
    e?.preventDefault();
    const errs = validate(fields, values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true); setServerError('');
    try { await onSubmit(serialize(fields, values), values); }
    catch (err) { setServerError(err.message); if (err.errors) setErrors(err.errors); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={busy ? undefined : onClose} title={title} size={size} footer={(
      <>
        <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>{t('cancel', 'Cancel')}</button>
        <button type="submit" form="resource-form" className="btn-primary" disabled={busy}>{busy && <Spinner className="h-4 w-4 text-white" />}{submitLabel}</button>
      </>
    )}>
      <form id="resource-form" onSubmit={submit} noValidate>
        {serverError && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{serverError}</div>}
        <FormFields fields={fields} values={values} setValues={setValues} errors={errors} />
      </form>
    </Modal>
  );
}
