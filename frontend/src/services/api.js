import axios from 'axios';

const TOKEN_KEY = 'egs_token';
export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } },
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const lang = localStorage.getItem('egs_lang') || 'en';
  config.headers['Accept-Language'] = lang;
  if (config.method === 'get') {
    config.params = { language: lang, ...config.params };
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    let message = error.response?.data?.message;
    if (!message) {
      if (error.code === 'ECONNABORTED') message = 'The server took too long to respond. Please try again.';
      else if (!error.response) message = 'Cannot reach the server. Check that the backend is running and your connection is working.';
      else message = `Request failed (${status})`;
    }
    if (status === 401 && tokenStore.get() && !error.config?.url?.includes('/auth/login')) {
      tokenStore.clear();
      window.dispatchEvent(new CustomEvent('auth:expired', { detail: message }));
    }
    const e = new Error(message);
    e.status = status;
    e.errors = error.response?.data?.errors;
    return Promise.reject(e);
  },
);

/** Unwraps { success, data, meta, message } */
export async function request(method, url, data, config = {}) {
  const res = await api.request({ method, url, data, ...config });
  return res.data;
}
export const get = (url, params) => request('get', url, undefined, { params });
export const post = (url, data) => request('post', url, data);
export const put = (url, data) => request('put', url, data);
export const patch = (url, data) => request('patch', url, data);
export const del = (url) => request('delete', url);

export default api;
