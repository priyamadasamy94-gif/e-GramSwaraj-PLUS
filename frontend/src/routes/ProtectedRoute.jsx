import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingBlock } from '../components/ui/Feedback';

export function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <LoadingBlock label="Loading your session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children || <Outlet />;
}

export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingBlock />;
  return user ? <Navigate to="/" replace /> : children;
}
