import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Megaphone, Pause, Play } from 'lucide-react';

export function GovMarquee() {
  const { t } = useLanguage();
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div className="no-print bg-gov-50 border-b border-slate-200 text-xs overflow-hidden flex items-center relative h-9">
      {/* Label Badge */}
      <div className="bg-gov-700 text-white font-semibold px-3 py-2 flex items-center gap-1.5 h-full z-10 shadow-md">
        <Megaphone className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t('emergencyTicker', 'Announcements')}</span>
        <span className="sm:hidden">{t('alerts', 'Alerts')}</span>
      </div>
      
      {/* Marquee Content */}
      <div 
        className="flex-1 overflow-hidden whitespace-nowrap px-2 h-full flex items-center relative"
      >
        <div 
          className={`inline-block animate-marquee ${isPaused ? 'animate-pause' : ''}`}
          style={{ animationDuration: '40s' }}
        >
          <span className="mx-8 text-gov-800">
            <span className="text-red-600 font-bold mr-1">{t('marqueeNew', 'NEW:')}</span> 
            {t('marqueeMsg1', 'Gram Sabha meeting scheduled on October 2nd, 2026 at South Thittankulam Panchayat Bhawan. All citizens requested to attend.')}
          </span>
          <span className="mx-8 text-gov-800">
            <span className="text-saffron-600 font-bold mr-1">{t('marqueeUpdate', 'UPDATE:')}</span> 
            {t('marqueeMsg2', 'Jal Jeevan Mission Phase 4 tap connections verification in progress for Wards 1 to 4.')}
          </span>
          <span className="mx-8 text-gov-800">
            <span className="text-indiagreen-600 font-bold mr-1">{t('marqueeInfo', 'INFO:')}</span> 
            {t('marqueeMsg3', 'Citizen Grievance Redressal Camp every Wednesday 10:00 AM - 1:00 PM at Panchayat Office.')}
          </span>
          <span className="mx-8 text-gov-800 font-medium">
            📞 {t('helpline', 'Toll-Free Helpline')}: <span className="font-bold text-gov-700">1800-11-9988</span> (24x7)
          </span>
        </div>
      </div>
      
      {/* Play/Pause Control */}
      <button 
        onClick={() => setIsPaused(!isPaused)} 
        className="bg-white px-2.5 border-l border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-gov-700 transition-colors h-full flex items-center z-10"
        aria-label={isPaused ? t('playAnnouncements', 'Play announcements') : t('pauseAnnouncements', 'Pause announcements')}
        title={isPaused ? t('playAnnouncements', 'Play announcements') : t('pauseAnnouncements', 'Pause announcements')}
      >
        {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
      </button>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
          will-change: transform;
        }
        .animate-pause {
          animation-play-state: paused;
        }
      `}} />
    </div>
  );
}
