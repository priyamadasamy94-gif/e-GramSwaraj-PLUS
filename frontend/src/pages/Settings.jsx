import { useState } from 'react';
import { Settings as SettingsIcon, Save, KeyRound, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/ui/LanguageSelector';
import { put } from '../services/api';
import { Card, DetailGrid, PageHeader } from '../components/ui/Misc';
import { FormFields, validate } from '../components/ui/Form';
import { Spinner } from '../components/ui/Feedback';
import { formatDate, ROLE_LABELS } from '../utils/format';
import { useTheme, THEMES } from '../context/ThemeContext';

const PROFILE = [
  { name: 'name', label: 'Full name', required: true, minLength: 2 },
  { name: 'phone', label: 'Mobile', pattern: /^[0-9+\-\s]{7,15}$/, patternMessage: 'Enter a valid mobile number' },
];
const PASSWORD = [
  { name: 'currentPassword', label: 'Current password', type: 'password', required: true, span: 2, autoComplete: 'current-password' },
  { name: 'newPassword', label: 'New password', type: 'password', required: true, minLength: 8, autoComplete: 'new-password' },
  { name: 'confirm', label: 'Confirm new password', type: 'password', required: true, autoComplete: 'new-password' },
];

export default function Settings() {
  const { user, setUser, village } = useAuth();
  const { t } = useLanguage();
  const { theme, setTheme, fontScale, setFontScale, highContrast, toggleHighContrast } = useTheme();
  const toast = useToast();
  const [p, setP] = useState({ name: user.name, phone: user.phone || '' });
  const [pErr, setPErr] = useState({});
  const [pw, setPw] = useState({});
  const [pwErr, setPwErr] = useState({});
  const [busy, setBusy] = useState('');

  const saveProfile = async (e) => {
    e.preventDefault();
    const errs = validate(PROFILE, p);
    setPErr(errs);
    if (Object.keys(errs).length) return;
    setBusy('p');
    try {
      const r = await put('/auth/me', p);
      setUser(r.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const savePw = async (e) => {
    e.preventDefault();
    const errs = validate(PASSWORD, pw);
    if (pw.newPassword && pw.confirm !== pw.newPassword) errs.confirm = 'Passwords do not match';
    setPwErr(errs);
    if (Object.keys(errs).length) return;
    setBusy('pw');
    try {
      await put('/auth/change-password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({});
      toast.success('Password changed');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title={t('nav_settings', 'Settings')}
        subtitle="Your profile, language preferences and account security"
        icon={SettingsIcon}
      />

      {/* Appearance & Accessibility Card */}
      <Card title={<span className="flex items-center gap-2"><Globe className="h-4 w-4 text-gov-700" /> {t('appearanceAccessibility', 'Appearance & Accessibility')}</span>}>
        <div className="space-y-6">
          {/* Language Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">{t('selectLanguage', 'Select Language')}</h3>
            <p className="text-xs text-slate-500">
              {t('languageDescription', 'Choose your preferred language for the portal. Available in 10 prominent regional languages.')}
            </p>
            <LanguageSelector variant="pills" />
          </div>

          <hr className="border-slate-200" />

          {/* Theme Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">{t('theme', 'Portal Theme')}</h3>
                <p className="text-xs text-slate-500">{t('themeDescription', 'Select the visual appearance of the application.')}</p>
              </div>
              <button 
                onClick={toggleHighContrast}
                className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${highContrast ? 'bg-yellow-400 text-black' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {highContrast ? t('highContrastOn', 'High Contrast: ON') : t('highContrastOff', 'High Contrast: OFF')}
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  onClick={() => setTheme(th.id)}
                  className={`text-left p-3 rounded-lg border-2 transition-all flex items-start gap-3 ${
                    theme === th.id 
                      ? `border-gov-500 bg-gov-50 ring-1 ring-gov-500 ring-offset-1`
                      : `border-slate-200 hover:border-gov-300 hover:bg-slate-50`
                  }`}
                >
                  <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full ${th.previewBadge} shadow-sm border border-black/10`}></div>
                  <div>
                    <p className={`text-sm font-semibold ${theme === th.id ? 'text-gov-800' : 'text-slate-800'}`}>{t(`theme_${th.id}`, th.name)}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mt-0.5">{th.subName}</p>
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">{t(`themeDesc_${th.id}`, th.description)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-slate-200" />
          
          {/* Text Size */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">{t('fontSize', 'Text Size')}</h3>
            <div className="flex gap-3">
              {[
                { id: 'sm', label: t('fontSm', 'Smaller (90%)') },
                { id: 'normal', label: t('fontNormal', 'Normal (100%)') },
                { id: 'lg', label: t('fontLg', 'Large (112%)') },
                { id: 'xl', label: t('fontXl', 'Extra Large (125%)') },
              ].map(sz => (
                <button
                  key={sz.id}
                  onClick={() => setFontScale(sz.id)}
                  className={`px-4 py-2 rounded-md text-sm transition-colors ${fontScale === sz.id ? 'bg-gov-700 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Account Details">
        <DetailGrid items={[
          ['Email', user.email],
          ['Role', ROLE_LABELS[user.role]],
          ['Village', village ? `${village.name}, ${village.taluk}` : 'Thittankulam'],
          ['Member since', formatDate(user.createdAt)],
        ]} />
      </Card>

      <Card title="Profile">
        <form onSubmit={saveProfile} noValidate>
          <FormFields fields={PROFILE} values={p} setValues={setP} errors={pErr} />
          <div className="mt-4 flex justify-end">
            <button className="btn-primary" disabled={busy === 'p'}>
              {busy === 'p' ? <Spinner className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />}
              {t('save', 'Save profile')}
            </button>
          </div>
        </form>
      </Card>

      <Card title="Change password">
        <form onSubmit={savePw} noValidate>
          <FormFields fields={PASSWORD} values={pw} setValues={setPw} errors={pwErr} />
          <div className="mt-4 flex justify-end">
            <button className="btn-primary" disabled={busy === 'pw'}>
              {busy === 'pw' ? <Spinner className="h-4 w-4 text-white" /> : <KeyRound className="h-4 w-4" />}
              Change password
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
