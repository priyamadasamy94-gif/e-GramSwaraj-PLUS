import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AuthShell } from './Login';
import { FormFields, validate } from '../components/ui/Form';
import { Spinner } from '../components/ui/Feedback';

const OTP_LENGTH = 6;

function formatCountdown(msLeft) {
  const totalSeconds = Math.max(0, Math.ceil(msLeft / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function Register() {
  const { register, verifyRegistrationOtp, resendRegistrationOtp } = useAuth();
  const { t } = useLanguage();
  const nav = useNavigate();
  const FIELDS = [
    { name: 'name', label: t('fullName'), required: true, minLength: 2, span: 2, autoComplete: 'name' },
    { name: 'email', label: t('email'), type: 'email', required: true, autoComplete: 'email' },
    { name: 'phone', label: t('phoneNumber'), required: true, pattern: /^[0-9+\-\s]{7,15}$/, patternMessage: t('invalidPhone'), autoComplete: 'tel' },
    { name: 'ward', label: t('wardNumber'), type: 'select', placeholder: t('selectWard'), options: Array.from({ length: 9 }, (_, index) => ({ value: `Ward ${index + 1}`, label: `${t('wardNumber')} ${index + 1}` })) },
    { name: 'address', label: t('address') },
    { name: 'password', label: t('password'), type: 'password', required: true, minLength: 8, help: t('passwordHelp'), autoComplete: 'new-password' },
    { name: 'confirm', label: t('confirmPassword'), type: 'password', required: true, autoComplete: 'new-password' },
  ];
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [otpState, setOtpState] = useState({ step: 'form', userIdentifier: '', expiresAt: null, resendAt: null, otp: Array(OTP_LENGTH).fill('') });
  const [otpError, setOtpError] = useState('');

  useEffect(() => {
    if (!otpState.expiresAt) return undefined;
    const tick = () => {
      const left = new Date(otpState.expiresAt).getTime() - Date.now();
      setOtpState((prev) => ({ ...prev, timeLeft: Math.max(0, left) }));
    };
    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [otpState.expiresAt]);

  useEffect(() => {
    if (!otpState.resendAt) return undefined;
    const tick = () => {
      const left = new Date(otpState.resendAt).getTime() - Date.now();
      setOtpState((prev) => ({ ...prev, resendLeft: Math.max(0, left) }));
    };
    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [otpState.resendAt]);

  const countdownLabel = useMemo(() => {
    if (!otpState.expiresAt) return '05:00';
    return formatCountdown((new Date(otpState.expiresAt).getTime() - Date.now()) || 0);
  }, [otpState.expiresAt, otpState.timeLeft]);

  const resendDisabled = Boolean(otpState.resendAt && new Date(otpState.resendAt).getTime() > Date.now());

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(FIELDS, values);
    for (const field of FIELDS) {
      const value = values[field.name];
      if (field.required && (value === '' || value === undefined || value === null)) errs[field.name] = t('fieldRequired');
      else if (field.type === 'email' && value && !/^\S+@\S+\.\S+$/.test(value)) errs[field.name] = t('validEmail');
      else if (field.minLength && value && String(value).length < field.minLength) errs[field.name] = t('minLengthError').replace('{count}', field.minLength);
    }
    if (values.password && values.confirm !== values.password) errs.confirm = t('passwordMismatch');
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setError('');
    try {
      const sanitized = {
        ...values,
        name: String(values.name ?? '').trim(),
        email: String(values.email ?? '').trim(),
        phone: String(values.phone ?? '').trim(),
      };
      const { confirm, ...payload } = sanitized; // eslint-disable-line no-unused-vars
      const { data } = await register(payload);
      const mobile = payload.phone?.toString().trim();
      setOtpState({
        step: 'otp',
        userIdentifier: mobile,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        resendAt: null,
        otp: Array(OTP_LENGTH).fill(''),
        timeLeft: 5 * 60 * 1000,
      });
      setError(data?.devOtp ? `${t('otpSentEmail')} (Development OTP: ${data.devOtp})` : t('otpSentEmail'));
      setOtpError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const sanitized = value.replace(/\D/g, '').slice(-1);
    const nextOtp = [...otpState.otp];
    nextOtp[index] = sanitized;
    setOtpState((prev) => ({ ...prev, otp: nextOtp }));
    if (sanitized && index < OTP_LENGTH - 1) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    const otpValue = otpState.otp.join('');
    if (otpValue.length !== OTP_LENGTH) {
      setOtpError(t('otpEnterSixDigits'));
      return;
    }
    setBusy(true);
    setOtpError('');
    try {
      await verifyRegistrationOtp({ userIdentifier: String(otpState.userIdentifier ?? '').trim(), otp: otpValue });
      setOtpError('');
      nav('/', { replace: true });
    } catch (err) {
      setOtpError(t('otpInvalid'));
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    if (resendDisabled || !otpState.userIdentifier) return;
    setBusy(true);
    setOtpError('');
    try {
      const result = await resendRegistrationOtp({ userIdentifier: otpState.userIdentifier });
      setOtpState((prev) => ({
        ...prev,
        otp: Array(OTP_LENGTH).fill(''),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        resendAt: new Date(Date.now() + 30 * 1000).toISOString(),
        timeLeft: 5 * 60 * 1000,
        resendLeft: 30 * 1000,
      }));
      setError(result?.devOtp ? `${t('otpSentEmail')} (Development OTP: ${result.devOtp})` : t('otpSentEmail'));
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={t(otpState.step === 'otp' ? 'otpVerification' : 'citizenRegistration')}
      subtitle={otpState.step === 'otp'
        ? t('registrationOtpHint')
        : t('registrationIntro')}
    >
      {error && (
        <div className={`mb-4 rounded-md border px-3 py-2 text-sm ${otpState.step === 'otp' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`} role={otpState.step === 'otp' ? 'status' : 'alert'}>
          {error}
        </div>
      )}
      {otpState.step === 'otp' ? (
        <form onSubmit={submitOtp} noValidate>
          <div className="mb-4 text-center text-sm text-slate-600">{t('otpExpires')} <span className="font-semibold text-gov-700">{countdownLabel}</span></div>
          <div className="mb-4 flex items-center justify-between gap-2">
            {Array.from({ length: OTP_LENGTH }).map((_, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                value={otpState.otp[index]}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                className="h-12 w-12 rounded-lg border border-slate-300 bg-white text-center text-lg font-semibold text-slate-800 shadow-sm outline-none focus:border-gov-500 focus:ring-2 focus:ring-gov-100"
                maxLength={1}
                inputMode="numeric"
                aria-label={`OTP digit ${index + 1}`}
              />
            ))}
          </div>
          {otpError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {otpError}
            </div>
          )}
          <div className="mt-5 flex gap-3">
            <button type="submit" className="btn-primary flex-1 py-2.5" disabled={busy}>
              {busy && <Spinner className="h-4 w-4 text-white" />} {t('verifyOtp')}
            </button>
            <button type="button" className="btn-secondary flex-1 py-2.5 disabled:cursor-not-allowed disabled:opacity-50" disabled={resendDisabled || busy} onClick={resendOtp}>
              {t('resendOtp')}
            </button>
          </div>
          {resendDisabled && otpState.resendAt && (
            <div className="mt-3 text-center text-xs text-slate-500">{t('resendAvailable')} {formatCountdown(Math.max(0, new Date(otpState.resendAt).getTime() - Date.now()))}</div>
          )}
        </form>
      ) : (
        <form onSubmit={submit} noValidate>
          <FormFields fields={FIELDS} values={values} setValues={setValues} errors={errors} />
          <button className="btn-primary mt-5 w-full py-2.5" disabled={busy}>
            {busy && <Spinner className="h-4 w-4 text-white" />}{t('accountCreateSendOtp')}
          </button>
        </form>
      )}
      <p className="mt-4 text-center text-sm text-slate-600">
        {t('alreadyHaveAccount', 'Already registered?')}{' '}
        <Link to="/login" className="font-medium text-gov-700 hover:underline">
          {t('signIn', 'Sign in')}
        </Link>
      </p>
    </AuthShell>
  );
}
