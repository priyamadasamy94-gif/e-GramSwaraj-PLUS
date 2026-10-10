import { createContext, useContext, useEffect, useState } from 'react';
import { get } from '../services/api';
import { useLanguage } from './LanguageContext';

// Dropdown options (enums) come from the backend so frontend and API never drift.
const OptionsContext = createContext({});
export function OptionsProvider({ children }) {
  const [options, setOptions] = useState(null);
  const { language } = useLanguage();

  useEffect(() => {
    get('/meta/options', { language }).then((r) => setOptions(r.data)).catch(() => setOptions({}));
  }, [language]);

  return <OptionsContext.Provider value={options || {}}>{children}</OptionsContext.Provider>;
}
export const useOptions = () => useContext(OptionsContext);
