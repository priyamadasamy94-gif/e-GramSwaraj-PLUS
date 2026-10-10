import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, Settings, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/ui/LanguageSelector';
import { ROLE_LABELS } from '../utils/format';
import { isCitizen } from '../utils/roles';
import { getAdminNav, getCitizenNav } from './nav';
import { GovTopBar } from '../components/gov/GovTopBar';
import { GovHeader } from '../components/gov/GovHeader';
import { GovMarquee } from '../components/gov/GovMarquee';
import { GovFooter } from '../components/gov/GovFooter';
import { WhatsAppIcon, WhatsAppContactModal } from '../components/ui/WhatsAppButton';
export function VillageIdentity({ compact = false, light = false }) {
  const { village } = useAuth();
  const v = village || { name: 'South Thittankulam', taluk: 'Kovilpatti', state: 'Tamil Nadu', pincode: '628502' };
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2.5">
      <img src="/emblem.svg" alt="" className="h-9 w-9 shrink-0" />
      <div className="min-w-0 leading-tight">
        <div className={`text-[15px] font-bold tracking-tight ${light ? 'text-white' : 'text-gov-900'}`}>E-GramSwaraj<span className="text-saffron-500">+</span></div>
        <div className={`truncate text-xs font-semibold ${light ? 'text-gov-100' : 'text-slate-700'}`}>{v.name}</div>
        {!compact && <div className={`truncate text-[11px] ${light ? 'text-gov-200' : 'text-slate-500'}`}>{v.taluk}, {v.state} – {v.pincode}</div>}
      </div>
    </Link>
  );
}

function UserMenu({ nameClass = 'hidden lg:block' }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const nav = useNavigate();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const initials = user.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-slate-100" aria-haspopup="menu" aria-expanded={open}>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gov-700 text-xs font-semibold text-white">{initials}</span>
        <span className={`text-left leading-tight ${nameClass}`}>
          <span className="block max-w-[140px] truncate text-sm font-medium text-slate-800">{user.name}</span>
          <span className="block text-[11px] text-slate-500">{ROLE_LABELS[user.role]}</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 ${nameClass}`} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
          </div>
          <button role="menuitem" onClick={() => { setOpen(false); nav('/settings'); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <Settings className="h-4 w-4" /> {t('profileAndSettings', 'Profile & settings')}
          </button>
          <button role="menuitem" onClick={() => { logout(); nav('/login'); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" /> {t('logout', 'Log out')}
          </button>
        </div>
      )}
    </div>
  );
}

function Bellbutton() {
  const { unread } = useNotifications();
  const { t } = useLanguage();
  return (
    <Link to="/notifications" className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100" aria-label={t('notificationsUnread', 'Notifications, {{count}} unread').replace('{{count}}', unread)}>
      <Bell className="h-5 w-5" />
      {unread > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unread > 99 ? '99+' : unread}</span>}
    </Link>
  );
}

const linkCls = ({ isActive }) => `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${isActive ? 'bg-gov-700 text-white' : 'text-gov-100 hover:bg-gov-800 hover:text-white'}`;

function Sidebar({ onNavigate }) {
  const { user } = useAuth();
  const { unread } = useNotifications();
  const { t } = useLanguage();
  const adminNav = getAdminNav(t);
  const can = (i) => !i.roles || i.roles.includes(user.role);
  const Item = ({ i }) => (
    <NavLink to={i.to} end={i.end} className={linkCls} onClick={onNavigate}>
      <i.icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="flex-1 truncate">{i.label}</span>
      {i.badge === 'unread' && unread > 0 && <span className="rounded-full bg-saffron-500 px-1.5 text-[10px] font-bold text-white">{unread}</span>}
    </NavLink>
  );
  return (
    <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4" aria-label="Main navigation">
      {adminNav.map((entry) => {
        if (entry.group) {
          const items = entry.items.filter(can);
          if (!items.length) return null;
          return (
            <div key={entry.group}>
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-gov-300">{entry.group}</p>
              <div className="space-y-0.5">{items.map((i) => <Item key={i.to} i={i} />)}</div>
            </div>
          );
        }
        return can(entry) ? <Item key={entry.to} i={entry} /> : null;
      })}
    </nav>
  );
}

function OfficialLayout() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const { t } = useLanguage();
  useEffect(() => setOpen(false), [loc.pathname]);
  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-gov-900 lg:flex">
        <div className="tricolor h-1" />
        <div className="border-b border-gov-800 px-4 py-4"><VillageIdentity light /></div>
        <Sidebar />
        <div className="border-t border-gov-800 px-4 py-3 flex items-center justify-between">
          <p className="text-[11px] text-gov-300">Phase 1 · Village Portal</p>
          <LanguageSelector light />
        </div>
      </aside>
      {/* Mobile drawer */}
      {open && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-gov-900">
            <div className="tricolor h-1" />
            <div className="flex items-center justify-between border-b border-gov-800 px-4 py-4">
              <VillageIdentity light compact />
              <button onClick={() => setOpen(false)} className="text-gov-200" aria-label={t('closeMenu', 'Close menu')}><X className="h-5 w-5" /></button>
            </div>
            <Sidebar onNavigate={() => setOpen(false)} />
            <div className="border-t border-gov-800 p-3">
              <LanguageSelector light />
            </div>
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur shadow-sm">
          <GovTopBar />
          <GovHeader compact />
          <GovMarquee />
          <div className="flex h-12 items-center justify-between px-4 sm:px-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <button className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label={t('openMenu', 'Open menu')}><Menu className="h-5 w-5" /></button>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSelector />
              <Bellbutton />
              <UserMenu />
            </div>
          </div>
        </header>
        <main className="print-area flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6" id="main-content"><Outlet /></main>
        <GovFooter />
      </div>
    </div>
  );
}

function CitizenLayout() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const { t } = useLanguage();
  const citizenNav = getCitizenNav(t);
  useEffect(() => setOpen(false), [loc.pathname]);
  const cls = ({ isActive }) => `whitespace-nowrap rounded-md px-2.5 py-2 text-[13px] font-medium ${isActive ? 'bg-gov-50 text-gov-800' : 'text-slate-600 hover:bg-slate-100'}`;
  return (
    <div className="min-h-screen flex flex-col">
      <GovTopBar />
      <GovHeader />
      <GovMarquee />
      
      <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <button className="rounded-md p-2 text-slate-600 hover:bg-slate-100 xl:hidden" onClick={() => setOpen((o) => !o)} aria-label={t('menu', 'Menu')}><Menu className="h-5 w-5" /></button>
          <nav className="hidden flex-1 items-center gap-1 xl:flex" aria-label="Main navigation">
            {citizenNav.map((i) => <NavLink key={i.to} to={i.to} end={i.end} className={cls}>{i.label}</NavLink>)}
          </nav>
          <div className="flex items-center gap-3 ml-auto">
            <LanguageSelector />
            <Bellbutton />
            <UserMenu nameClass="hidden 2xl:block" />
          </div>
        </div>
        {open && (
          <nav className="grid grid-cols-2 gap-1 border-t border-slate-100 p-3 xl:hidden" aria-label="Mobile navigation">
            {citizenNav.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.end} className={cls}><span className="flex items-center gap-2"><i.icon className="h-4 w-4" />{i.label}</span></NavLink>
            ))}
          </nav>
        )}
      </header>
      <main className="print-area flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6" id="main-content"><Outlet /></main>
      <GovFooter />
    </div>
  );
}

function FloatingWhatsAppAssistant() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="no-print fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white shadow-xl hover:bg-[#20bd5a] hover:scale-105 transition-all active:scale-95 border-2 border-white ring-2 ring-emerald-500/30"
          title="Open WhatsApp Web Direct Contact Assistant"
        >
          <WhatsAppIcon className="h-5 w-5 fill-current" />
          <span className="hidden sm:inline">WhatsApp Web</span>
        </button>
      </div>

      <WhatsAppContactModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

export default function AppLayout() {
  const { user } = useAuth();
  return (
    <>
      {isCitizen(user) ? <CitizenLayout /> : <OfficialLayout />}
      <FloatingWhatsAppAssistant />
    </>
  );
}
