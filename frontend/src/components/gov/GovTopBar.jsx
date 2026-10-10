import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { LanguageSelector } from '../ui/LanguageSelector';
import { Moon, Sun, Type, Eye } from 'lucide-react';

export function GovTopBar() {
  const { t } = useLanguage();
  const { fontScale, increaseFontSize, decreaseFontSize, resetFontSize, toggleHighContrast, highContrast } = useTheme();

  return (
    <div className="no-print bg-gov-900 text-gov-50 py-1.5 px-4 text-[11px] font-medium hidden md:block">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Left Side: Govt Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="uppercase tracking-wider">{t('govIndia', 'भारत सरकार | GOVERNMENT OF INDIA')}</span>
          </div>
          <div className="w-px h-3 bg-gov-700"></div>
          <div className="flex items-center gap-1.5">
            <span className="uppercase tracking-wider">{t('mopr', 'पंचायती राज मंत्रालय | MINISTRY OF PANCHAYATI RAJ')}</span>
          </div>
        </div>

        {/* Right Side: Accessibility & Tools */}
        <div className="flex items-center gap-4">
          {/* Skip to Main Content */}
          <a href="#main-content" className="hover:text-white transition-colors focus:ring-2 focus:ring-white focus:outline-none">
            {t('skipToMain', 'Skip to Main Content')}
          </a>
          
          <div className="w-px h-3 bg-gov-700"></div>
          
          {/* Font Size Adjusters */}
          <div className="flex items-center bg-gov-800 rounded shadow-inner" role="group" aria-label={t('textSizeControls', 'Text size controls')}>
            <button 
              onClick={decreaseFontSize} 
              className="px-2 py-0.5 hover:bg-gov-700 hover:text-white transition-colors disabled:opacity-50"
              disabled={fontScale === 'sm'}
              title={t('decreaseFontSize', 'Decrease font size')}
            >A-</button>
            <button 
              onClick={resetFontSize} 
              className="px-2 py-0.5 border-l border-r border-gov-900 hover:bg-gov-700 hover:text-white transition-colors"
              title={t('normalFontSize', 'Normal font size')}
            >A</button>
            <button 
              onClick={increaseFontSize} 
              className="px-2 py-0.5 hover:bg-gov-700 hover:text-white transition-colors disabled:opacity-50"
              disabled={fontScale === 'xl'}
              title={t('increaseFontSize', 'Increase font size')}
            >A+</button>
          </div>

          <div className="w-px h-3 bg-gov-700"></div>

          {/* High Contrast Toggle */}
          <button 
            onClick={toggleHighContrast} 
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${highContrast ? 'bg-yellow-400 text-black' : 'hover:text-white'}`}
            title={t('highContrast', 'High Contrast')}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="sr-only">{t('highContrast', 'High Contrast')}</span>
          </button>

          <div className="w-px h-3 bg-gov-700"></div>

          {/* WhatsApp Web Direct Contact Launcher */}
          <button
            onClick={() => window.open('https://web.whatsapp.com', '_blank')}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors font-semibold"
            title={t('whatsappWebContact', 'Launch WhatsApp Web Direct Message')}
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.001 5.45-4.436 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.05 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893 0-3.18-1.238-6.167-3.488-8.416"/>
            </svg>
            <span>WhatsApp Web</span>
          </button>

          <div className="w-px h-3 bg-gov-700"></div>

          {/* Language Selector */}
          <LanguageSelector light />
        </div>
      </div>
    </div>
  );
}
