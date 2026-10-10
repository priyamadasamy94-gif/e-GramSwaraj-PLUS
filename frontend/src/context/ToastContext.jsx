import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-3), { id, type, message }]);
    setTimeout(() => dismiss(id), type === 'error' ? 6000 : 3500);
  }, [dismiss]);
  const api = { success: (m) => push('success', m), error: (m) => push('error', m), info: (m) => push('info', m) };
  const icon = { success: CheckCircle2, error: AlertTriangle, info: Info };
  const tone = { success: 'border-green-600 text-green-800', error: 'border-red-600 text-red-800', info: 'border-gov-600 text-gov-800' };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="no-print fixed bottom-4 right-4 z-[1100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = icon[t.type];
          return (
            <div key={t.id} className={`flex items-start gap-3 rounded-md border-l-4 bg-white p-3 shadow-lg ${tone[t.type]}`}>
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <p className="flex-1 text-sm text-slate-700">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-600" aria-label="Dismiss"><X className="h-4 w-4" /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
