import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AshokaLionCapital, SwachhBharatLogo, DigitalIndiaLogo, EGramSwarajBadge } from './GovLogos';
import { Link } from 'react-router-dom';

export function GovHeader({ compact = false }) {
  const { t } = useLanguage();

  return (
    <div className="no-print bg-white border-b border-slate-200 shadow-sm relative">
      {/* Tricolor Ribbon at top of header */}
      <div className="tricolor h-1 w-full absolute top-0 left-0"></div>
      
      <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Branding & Emblems */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <AshokaLionCapital className="h-12 md:h-16 w-auto flex-shrink-0" />
          
          <div className="w-px h-10 md:h-14 bg-slate-200 hidden md:block"></div>
          
          <Link to="/" className="flex flex-col gap-0.5 group">
            <div className="flex items-center gap-2">
              <EGramSwarajBadge className="h-9 md:h-11" />
            </div>
            {!compact && (
              <p className="text-[10px] md:text-xs text-slate-500 font-medium group-hover:text-gov-600 transition-colors">
                {t('brandTagline', 'A Simplified Work Based Accounting Application for Panchayati Raj')}
              </p>
            )}
          </Link>
        </div>

        {/* Right: GP Info & Secondary Logos */}
        <div className="flex flex-col items-end gap-2 w-full md:w-auto mt-2 md:mt-0">
          <div className="flex items-center gap-4">
            <SwachhBharatLogo className="h-7 md:h-9 hidden lg:block" />
            <DigitalIndiaLogo className="h-7 md:h-9 hidden sm:block" />
          </div>
          
          {!compact && (
            <div className="text-right">
              <p className="text-[11px] font-semibold text-slate-700">{t('footerGPName', 'South Thittankulam Village Panchayat')}</p>
              <p className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
                {t('lgdCode', 'LGD: 231907 | TN')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
