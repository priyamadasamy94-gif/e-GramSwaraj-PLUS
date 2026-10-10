import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { get } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext({ unread: 0, refresh: () => {} });
export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const refresh = useCallback(async () => {
    if (!user) return;
    try { setUnread((await get('/notifications/unread-count')).data.count); } catch { /* non-critical */ }
  }, [user]);
  useEffect(() => {
    if (!user) { setUnread(0); return undefined; }
    refresh();
    const id = setInterval(refresh, 60000);
    return () => clearInterval(id);
  }, [user, refresh]);
  return <NotificationContext.Provider value={{ unread, refresh }}>{children}</NotificationContext.Provider>;
}
export const useNotifications = () => useContext(NotificationContext);
