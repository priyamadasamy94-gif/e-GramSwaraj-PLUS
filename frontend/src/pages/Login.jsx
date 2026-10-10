import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { LanguageSelector } from '../components/ui/LanguageSelector';
import { get } from '../services/api';
import { Spinner } from '../components/ui/Feedback';

const OFFICIAL_ACCOUNTS = [
  ['Panchayat Secretary (Ramesh)', 'tutkpti.tnbdo@gmail.com', 'Officer@123'],
  ['Administrator (BDO)', 'admin@stk.gov.demo', 'Admin@123'],
  ['Panchayat Officer', 'officer@stk.gov.demo', 'Officer@123'],
  ['Staff / Overseer', 'staff@stk.gov.demo', 'Staff@123'],
  ['Registered Citizen (Ward 1)', 'citizen@stk.gov.demo', 'Citizen@123'],
];

export function AuthShell({ children, title, subtitle }) {
  const [v, setV] = useState(null);
  const { t } = useLanguage();

  useEffect(() => {
    get('/villages/public').then((r) => setV(r.data)).catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      {/* Left Hero Panel */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-gov-900 px-6 py-8 text-white lg:w-[44%] lg:px-12 lg:py-12">
        <div className="tricolor absolute inset-x-0 top-0 h-1.5" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/emblem.svg" alt="" className="h-12 w-12" />
            <div>
              <p className="text-xl font-bold">E-GramSwaraj<span className="text-saffron-400">+</span></p>
              <p className="text-sm text-gov-200">{t('brandTagline', 'Digital Village Governance')}</p>
            </div>
          </div>
          <div className="lg:hidden">
            <LanguageSelector light />
          </div>
        </div>

        <div className="mt-8 lg:mt-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-saffron-400">
              {t('group_village', 'Village')} Panchayat Portal
            </span>
            <span className="rounded bg-gov-800 px-2 py-0.5 text-[11px] font-medium text-gov-200">
              LGD: {v?.lgdCode || '231907'}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-bold leading-tight lg:text-4xl">{v?.name || 'South Thittankulam'}</h1>
          <p className="mt-2 text-gov-100">
            {v ? `${v.panchayatName || 'Thittankulam Panchayat'} · ${v.taluk} Taluk, ${v.district ? `${v.district}, ` : ''}${v.state} – ${v.pincode}` : 'Kovilpatti, Tamil Nadu – 628502'}
          </p>
          <ul className="mt-6 hidden space-y-2 text-sm text-gov-100 lg:block">
            <li>• {t('nav_plans', 'Development plans')} & {t('nav_works', 'works tracking')} (116 official activities)</li>
            <li>• {t('nav_assets', 'Village assets')} (18 registered assets), {t('nav_budget', 'budget and finance')}</li>
            <li>• {t('nav_meetings', 'Gram Sabha meetings')} & {t('nav_announcements', 'official announcements')}</li>
            <li>• {t('nav_grievances', 'Citizen grievance redressal')} with live tracking</li>
          </ul>
        </div>

        <div className="mt-8 hidden lg:block">
          <p className="text-xs text-gov-300">
            Official platform for Thittankulam Village Panchayat (LGD: 231907), Kovilpatti, Thoothukkudi District.
          </p>
        </div>
      </div>

      {/* Right Form Area */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
              {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            </div>
            <div className="hidden lg:block">
              <LanguageSelector />
            </div>
          </div>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const { login, googleLogin, sessionMessage } = useAuth();
  const { t } = useLanguage();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const handleGoogleSuccess = async ({ credential }) => {
    setGoogleError('');
    setBusy(true);
    try {
      await googleLogin(credential);
      nav(loc.state?.from || '/', { replace: true });
    } catch (loginError) {
      setGoogleError(loginError.message || 'Google sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleError = (loginError) => {
    setGoogleError(loginError.message || 'Google sign-in failed. Please try again.');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await login(form.email.trim(), form.password);
      nav(loc.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={t('signIn', 'Sign in')}
      subtitle={`Officials and registered citizens of Thittankulam (LGD: 231907)`}
    >
      {(error || sessionMessage) && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error || sessionMessage}
        </div>
      )}
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="email">{t('email', 'Email')}</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="e.g. tutkpti.tnbdo@gmail.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">{t('password', 'Password')}</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
        </div>
        <button className="btn-primary w-full py-2.5" disabled={busy}>
          {busy ? <Spinner className="h-4 w-4 text-white" /> : <LogIn className="h-4 w-4" />} {t('signIn', 'Sign in')}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-400" aria-hidden="true">
        <span className="h-px flex-1 bg-slate-200" />
        <span>OR</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
      {googleError && <p className="mt-3 text-center text-sm text-amber-800" role="status">{googleError}</p>}

      <p className="mt-4 text-center text-sm text-slate-600">
        New resident?{' '}
        <Link to="/register" className="font-medium text-gov-700 hover:underline">
          {t('createAccount', 'Register as a citizen')}
        </Link>
      </p>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <ShieldCheck className="h-4 w-4 text-gov-700" /> Official & Demo Logins
        </p>
        <div className="mt-3 grid gap-2">
          {OFFICIAL_ACCOUNTS.map(([role, email, pw]) => (
            <button
              key={email}
              type="button"
              onClick={() => setForm({ email, password: pw })}
              className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-left text-sm transition-colors hover:border-gov-300 hover:bg-gov-50"
            >
              <span className="font-medium text-slate-700">{role}</span>
              <span className="truncate pl-2 font-mono text-xs text-slate-500">{email}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">Click any account above to autofill, then click Sign in.</p>
      </div>
    </AuthShell>
  );
}
