import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { NICLogo, DigitalIndiaLogo } from './GovLogos';

export function GovFooter() {
  const { t } = useLanguage();

  return (
    <footer className="no-print bg-gov-950 text-slate-300 text-xs border-t-4 border-gov-700 w-full mt-auto">
      {/* Upper Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white font-semibold mb-3 border-b border-gov-800 pb-2 uppercase tracking-wide">{t('footerGovPortals', 'Government Portals')}</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-white transition-colors">{t('footerNPI', 'National Portal of India')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footerMyGov', 'MyGov Platform')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footerDigitalIndia', 'Digital India')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footerDataGov', 'Data.gov.in (Open Data)')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footerIndiaCode', 'India Code')}</a></li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-white font-semibold mb-3 border-b border-gov-800 pb-2 uppercase tracking-wide">{t('footerPanchayatiRaj', 'Panchayati Raj')}</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-white transition-colors">{t('footerMopr', 'Ministry of Panchayati Raj')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footerLGD', 'Local Government Directory (LGD)')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footerPFMS', 'PFMS Portal')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footerGramUrja', 'Gram Urja Swaraj')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footerAuditOnline', 'AuditOnline')}</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3 border-b border-gov-800 pb-2 uppercase tracking-wide">{t('footerCitizenInfo', 'Citizen Info')}</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-white transition-colors">{t('footerCitizenCharter', 'Citizen Charter')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footerRTIGuidelines', 'RTI Guidelines')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footerPublicGrievances', 'Public Grievances')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footerHelpFAQ', 'Help & FAQs')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footerContactDirectory', 'Contact Directory')}</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3 border-b border-gov-800 pb-2 uppercase tracking-wide">{t('footerPolicies', 'Policies')}</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-white transition-colors">{t('footerWebsitePolicies', 'Website Policies')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footerTermsOfUse', 'Terms of Use')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footerPrivacyPolicy', 'Privacy Policy')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footerCopyrightPolicy', 'Copyright Policy')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footerWebInfoManager', 'Web Information Manager')}</a></li>
          </ul>
        </div>
      </div>

      {/* Analytics & Stats Bar */}
      <div className="bg-gov-900 border-y border-gov-800 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-slate-400">
          <div>{t('lastUpdated', 'Last Updated')}: <span className="text-white font-medium">28 Sep 2026, 05:15 PM IST</span></div>
          <div className="flex gap-4">
            <div>{t('visitors', 'Total Visitors')}: <span className="bg-gov-950 px-2 py-0.5 rounded font-mono text-white border border-gov-800">18492301</span></div>
            <div className="hidden sm:block">{t('footerPortalVersion', 'Portal Version: 2.4.0 (GIGW 3.0)')}</div>
          </div>
        </div>
      </div>

      {/* Bottom Legal & NIC Attribution */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row items-center justify-between gap-6 text-center lg:text-left text-[11px]">
        <div className="max-w-2xl text-slate-400 leading-relaxed">
          <p className="mb-1">
            {t('footerWebsiteManagedBy', 'Website Content Managed by')} <strong>{t('footerGPName', 'South Thittankulam Village Panchayat')}</strong>, 
            {' '}{t('mopr', 'Ministry of Panchayati Raj')}, {t('govIndia', 'Government of India')}
          </p>
          <p>
            {t('footerDesignedBy', 'Designed, Developed and Hosted by')} <strong>{t('footerNIC', 'National Informatics Centre (NIC)')}</strong>, 
            {' '}{t('footerMeity', 'Ministry of Electronics & Information Technology, Government of India')}.
          </p>
        </div>
        
        <div className="flex items-center gap-6 opacity-80 hover:opacity-100 transition-opacity">
          <NICLogo light className="h-9" />
          <div className="w-px h-8 bg-gov-800"></div>
          <DigitalIndiaLogo className="h-9" />
        </div>
      </div>
    </footer>
  );
}
