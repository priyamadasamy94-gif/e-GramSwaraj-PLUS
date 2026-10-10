import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { get, post, tokenStore } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [village, setVillage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState('');

  const loadMe = useCallback(async () => {
    if (!tokenStore.get()) { setLoading(false); return; }
    try {
      const { data } = await get('/auth/me');
      setUser(data.user); setVillage(data.village);
    } catch {
      tokenStore.clear(); setUser(null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);
  useEffect(() => {
    const onExpired = (e) => { setUser(null); setSessionMessage(e.detail || 'Your session has expired. Please log in again.'); };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const login = async (email, password) => {
    const { data } = await post('/auth/login', { email, password });
    tokenStore.set(data.token); setSessionMessage('');
    setUser(data.user);
    const me = await get('/auth/me'); setVillage(me.data.village);
    // Notify language context to adopt the user's stored language preference from MySQL
    if (data.user?.language) {
      window.dispatchEvent(new CustomEvent('auth:language', { detail: data.user.language }));
    }
    return data.user;
  };
  const googleLogin = async (credential) => {
    const { data } = await post('/auth/google', { credential });
    tokenStore.set(data.token); setSessionMessage('');
    setUser(data.user);
    const me = await get('/auth/me'); setVillage(me.data.village);
    if (data.user?.language) {
      window.dispatchEvent(new CustomEvent('auth:language', { detail: data.user.language }));
    }
    return data.user;
  };
  const register = async (payload) => {
    const { data } = await post('/auth/register', payload);
    return data;
  };
  const verifyRegistrationOtp = async (payload) => {
    const { data } = await post('/auth/register/verify-otp', payload);
    tokenStore.set(data.token); setSessionMessage('');
    setUser(data.user);
    const me = await get('/auth/me'); setVillage(me.data.village);
    if (data.user?.language) {
      window.dispatchEvent(new CustomEvent('auth:language', { detail: data.user.language }));
    }
    return data.user;
  };
  const resendRegistrationOtp = async (payload) => {
    const { data } = await post('/auth/register/resend-otp', payload);
    return data;
  };
  const logout = () => { tokenStore.clear(); setUser(null); setVillage(null); };

  const value = useMemo(() => ({ user, setUser, village, loading, login, googleLogin, register, verifyRegistrationOtp, resendRegistrationOtp, logout, sessionMessage }), [user, village, loading, sessionMessage]); // eslint-disable-line
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
