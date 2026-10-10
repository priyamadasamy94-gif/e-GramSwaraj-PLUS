import { useEffect, useRef, useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function LanguageSelector({ variant = 'dropdown', light = false }) {
  const { language, setLanguage, supportedLanguages, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  if (variant === 'pills') {
    return (
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Select language">
        {supportedLanguages.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLanguage(l.code)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              language === l.code
                ? 'bg-gov-700 text-white shadow-sm ring-1 ring-gov-800'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{l.flag}</span>
            <span>{l.native}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
          light
            ? 'text-white bg-gov-800/80 hover:bg-gov-800 ring-1 ring-white/20'
            : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200'
        }`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t('changeLanguage', 'Change language')}
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="font-semibold">{currentLang.native}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1.5 w-44 origin-top-right rounded-lg border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Language / மொழி / భాష / भाषा
          </div>
          {supportedLanguages.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitem"
              onClick={() => {
                setLanguage(l.code);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-xs transition-colors ${
                language === l.code
                  ? 'bg-gov-50 font-semibold text-gov-800'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-sm">{l.flag}</span>
                <span>{l.native} ({l.label})</span>
              </span>
              {language === l.code && <Check className="h-3.5 w-3.5 text-gov-700 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
