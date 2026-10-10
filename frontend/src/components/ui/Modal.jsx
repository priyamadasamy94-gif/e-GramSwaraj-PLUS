import { useEffect, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Spinner } from './Feedback';

export function Modal({ open, onClose, title, children, footer, size = 'lg' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => ref.current?.querySelector('input,select,textarea,button')?.focus(), 30);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  const width = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size];
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={`flex max-h-[92vh] w-full ${width} flex-col rounded-t-xl bg-white shadow-xl sm:rounded-xl`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:rounded-b-xl">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title = 'Are you sure?', message, confirmLabel = 'Delete', onConfirm, onCancel, busy, danger = true }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm" footer={(
      <>
        <button className="btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={busy}>{busy && <Spinner className="h-4 w-4 text-white" />}{confirmLabel}</button>
      </>
    )}>
      <div className="flex gap-3">
        <div className="h-fit rounded-full bg-red-50 p-2"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
        <p className="text-sm text-slate-600">{message}</p>
      </div>
    </Modal>
  );
}
