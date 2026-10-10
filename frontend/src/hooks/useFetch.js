import { useCallback, useEffect, useRef, useState } from 'react';
import { get } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

/** GET an endpoint and track loading/error. Pass null url to skip. */
export function useFetch(url, params) {
  const { language } = useLanguage();
  const [state, setState] = useState({ data: null, meta: null, loading: !!url, error: null });
  const key = JSON.stringify(params || {});
  const seq = useRef(0);
  const load = useCallback(async () => {
    if (!url) return;
    const my = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await get(url, { language, ...params });
      if (my === seq.current) setState({ data: res.data, meta: res.meta, loading: false, error: null });
    } catch (e) {
      if (my === seq.current) setState((s) => ({ ...s, loading: false, error: e.message }));
    }
  }, [url, key, language]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}

export function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
