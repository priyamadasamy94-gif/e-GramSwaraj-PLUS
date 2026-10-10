import { createContext, useContext, useEffect, useState } from 'react';
import { SUPPORTED_LANGUAGES, translations } from '../i18n/translations';
import { patch, tokenStore } from '../services/api';

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
  supportedLanguages: SUPPORTED_LANGUAGES,
});

const LANG_KEY = 'egs_lang';

/** Persist language to MySQL backend (fire-and-forget — failures don't block UI) */
async function persistLanguageToBackend(langCode) {
  if (!tokenStore.get()) return; // not logged in
  try {
    await patch('/auth/me', { language: langCode });
  } catch {
    // Non-critical: localStorage already holds the preference
  }
}

export function LanguageProvider({ children }) {
  const [language, setLangState] = useState(() => {
    try {
      return localStorage.getItem(LANG_KEY) || 'en';
    } catch {
      return 'en';
    }
  });

  /**
   * Call this to change language.
   * - Updates React state immediately
   * - Writes to localStorage for offline/anonymous persistence
   * - Writes to MySQL via /auth/me when the user is logged in
   */
  const setLanguage = (langCode) => {
    if (translations[langCode]) {
      setLangState(langCode);
      try {
        localStorage.setItem(LANG_KEY, langCode);
      } catch {
        // ignore storage errors
      }
      document.documentElement.lang = langCode;
      persistLanguageToBackend(langCode);
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // When user logs in, AuthContext dispatches 'auth:language' with the DB-persisted language.
  // Adopt it so the UI matches the user's stored preference from MySQL.
  useEffect(() => {
    const onAuthLanguage = (e) => {
      const lang = e.detail;
      if (lang && translations[lang] && lang !== language) {
        setLangState(lang);
        try { localStorage.setItem(LANG_KEY, lang); } catch { /* ignore */ }
        document.documentElement.lang = lang;
      }
    };
    window.addEventListener('auth:language', onAuthLanguage);
    return () => window.removeEventListener('auth:language', onAuthLanguage);
  }, [language]);

  /**
   * When the user logs in with a different stored language in MySQL,
   * adopt it so the UI matches their backend-persisted preference.
   * The AuthContext exposes the user object which includes `language`.
   */
  const syncFromUser = (userLanguage) => {
    if (userLanguage && translations[userLanguage] && userLanguage !== language) {
      setLangState(userLanguage);
      try {
        localStorage.setItem(LANG_KEY, userLanguage);
      } catch { /* ignore */ }
      document.documentElement.lang = userLanguage;
    }
  };

  const resolveKey = (obj, path) => {
    if (!obj || !path) return undefined;
    if (obj[path] !== undefined) return obj[path];
    const parts = String(path).split('.');
    let curr = obj;
    for (const part of parts) {
      if (curr == null || typeof curr !== 'object') return undefined;
      curr = curr[part];
    }
    return curr !== undefined ? curr : undefined;
  };

  const t = (key, fallback) => {
    const langDict = translations[language] || translations.en;
    const val = resolveKey(langDict, key);
    if (val !== undefined && typeof val !== 'object') return val;
    const fallbackVal = resolveKey(translations.en, key);
    if (fallbackVal !== undefined && typeof fallbackVal !== 'object') return fallbackVal;
    return fallback !== undefined ? fallback : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, syncFromUser, t, supportedLanguages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
export default LanguageContext;
