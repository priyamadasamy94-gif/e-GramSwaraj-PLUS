import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react';

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`animate-spin text-gov-600 ${className}`} aria-hidden />;
}

export function LoadingBlock({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500" role="status">
      <Spinner /> {label}
    </div>
  );
}

export function EmptyState({ title = 'No records found', message = 'Try changing the filters or add a new record.', action, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
      <div className="mb-3 rounded-full bg-slate-100 p-3"><Icon className="h-6 w-6 text-slate-400" aria-hidden /></div>
      <p className="font-medium text-slate-700">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center" role="alert">
      <div className="mb-3 rounded-full bg-red-50 p-3"><AlertTriangle className="h-6 w-6 text-red-600" aria-hidden /></div>
      <p className="font-medium text-slate-800">Something went wrong</p>
      <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>
      {onRetry && <button className="btn-secondary mt-4" onClick={onRetry}><RefreshCw className="h-4 w-4" /> Try again</button>}
    </div>
  );
}

/** Wraps a data region with loading / error / empty handling. */
export function AsyncBoundary({ loading, error, empty, onRetry, emptyProps, children }) {
  if (loading) return <LoadingBlock />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (empty) return <EmptyState {...emptyProps} />;
  return children;
}
