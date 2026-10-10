import React, { useState } from 'react';
import { openWhatsAppWeb, getWhatsAppWebUrl } from '../../utils/whatsapp';
import { MessageSquare, Send, X, PhoneCall, UserCheck, ShieldCheck, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function WhatsAppIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.001 5.45-4.436 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.05 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893 0-3.18-1.238-6.167-3.488-8.416"/>
    </svg>
  );
}

export function WhatsAppButton({
  phone,
  message = '',
  label = 'WhatsApp Web',
  size = 'md',
  variant = 'primary',
  className = '',
  showIcon = true,
}) {
  const handleClick = (e) => {
    e.stopPropagation();
    openWhatsAppWeb(phone, message);
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-xs font-medium gap-1.5',
    lg: 'px-4 py-2 text-sm font-semibold gap-2',
  };

  const variants = {
    primary: 'bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-sm transition-transform active:scale-95',
    secondary: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300',
    outline: 'border border-[#25D366] text-[#128C7E] hover:bg-[#25D366] hover:text-white',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Open and send direct message via WhatsApp Web"
      className={`inline-flex items-center justify-center rounded-md font-sans leading-none ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {showIcon && <WhatsAppIcon className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />}
      {label && <span>{label}</span>}
    </button>
  );
}

export function WhatsAppContactModal({ isOpen, onClose, initialPhone = '', defaultSubject = '', recordType = '' }) {
  const { t } = useLanguage();
  const [phone, setPhone] = useState(initialPhone || '916381746557');
  const [recipient, setRecipient] = useState('Panchayat Official Test Line');
  const [customMsg, setCustomMsg] = useState(
    defaultSubject
      ? `Hello, inquiring regarding ${defaultSubject} on E-GramSwaraj+ platform.`
      : `Hello, I am contacting you regarding South Thittankulam Village Panchayat operations on E-GramSwaraj+.`
  );

  if (!isOpen) return null;

  const OFFICIAL_CONTACTS = [
    { name: 'Panchayat Official (Test Line)', phone: '916381746557', role: 'Official In-charge / Testing' },
    { name: 'Public Grievance Helpdesk', phone: '916381746557', role: 'Civic Support' },
    { name: 'Panchayat President', phone: '919840234567', role: 'Elected Representative' },
    { name: 'CSC Service Operator', phone: '919840456789', role: 'Digital Services' },
  ];

  const handleSelectOfficial = (item) => {
    setRecipient(item.name);
    setPhone(item.phone);
  };

  const handleSend = (e) => {
    e.preventDefault();
    openWhatsAppWeb(phone, customMsg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#075E54] px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="rounded-full bg-[#25D366] p-1.5 text-white">
              <WhatsAppIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Send WhatsApp Web Message</h3>
              <p className="text-xs text-emerald-100">South Thittankulam Village Panchayat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-emerald-100 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSend} className="p-5 space-y-4 text-sm">
          {/* Preset Officials Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Recipient / Official Contact
            </label>
            <div className="grid grid-cols-2 gap-2">
              {OFFICIAL_CONTACTS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleSelectOfficial(item)}
                  className={`flex flex-col text-left p-2.5 rounded-lg border text-xs transition-all ${
                    phone === item.phone
                      ? 'border-[#25D366] bg-emerald-50/70 text-emerald-950 font-medium ring-1 ring-[#25D366]'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                  <span className="text-[11px] text-slate-500">{item.role}</span>
                  <span className="mt-1 font-mono text-[10px] text-emerald-700">+91 {item.phone.slice(-10)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Phone input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              WhatsApp Phone Number
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs font-medium text-slate-500">+91</span>
              <input
                type="text"
                value={phone.replace(/^91/, '')}
                onChange={(e) => setPhone('91' + e.target.value.replace(/\D/g, ''))}
                placeholder="9840123456"
                className="w-full rounded-lg border border-slate-300 pl-11 pr-3 py-2 text-sm text-slate-800 focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366]"
                required
              />
            </div>
          </div>

          {/* Message textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Prefilled Message Text
            </label>
            <textarea
              rows={3}
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-800 focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366]"
              placeholder="Type message here..."
            />
          </div>

          {/* Web WhatsApp Info Box */}
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 flex items-start gap-2">
            <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
            <div>
              <strong>WhatsApp Web Direct Launcher:</strong> Clicking <em>Launch WhatsApp Web</em> opens{' '}
              <code className="text-[11px] bg-emerald-100 px-1 py-0.5 rounded font-mono">web.whatsapp.com</code> in a new browser tab with recipient and message preloaded.
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#25D366] hover:bg-[#20bd5a] rounded-lg shadow-sm transition-transform active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Launch WhatsApp Web</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
