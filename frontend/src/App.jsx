import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute, GuestRoute } from './routes/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import { useAuth } from './context/AuthContext';
import { LoadingBlock } from './components/ui/Feedback';
import { MANAGERS, OFFICIALS } from './utils/roles';
import Login from './pages/Login';
import Register from './pages/Register';
import { NotFound, Unauthorized } from './pages/Errors';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const CitizenDashboard = lazy(() => import('./pages/CitizenDashboard'));
const VillageProfile = lazy(() => import('./pages/VillageProfile'));
const VillageInfo = lazy(() => import('./pages/VillageInfo'));
const Plans = lazy(() => import('./pages/Plans'));
const Works = lazy(() => import('./pages/Works'));
const Assets = lazy(() => import('./pages/Assets'));
const Budget = lazy(() => import('./pages/Finance').then((m) => ({ default: m.Budget })));
const Transactions = lazy(() => import('./pages/Finance').then((m) => ({ default: m.Transactions })));
const FinanceOverview = lazy(() => import('./pages/Finance').then((m) => ({ default: m.FinanceOverview })));
const Meetings = lazy(() => import('./pages/Meetings'));
const Citizens = lazy(() => import('./pages/Citizens'));
const Grievances = lazy(() => import('./pages/Grievances'));
const SubmitGrievance = lazy(() => import('./pages/CitizenGrievance').then((m) => ({ default: m.SubmitGrievance })));
const TrackGrievance = lazy(() => import('./pages/CitizenGrievance').then((m) => ({ default: m.TrackGrievance })));
const Announcements = lazy(() => import('./pages/Announcements'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Reports = lazy(() => import('./pages/Reports'));
const Users = lazy(() => import('./pages/Users'));
const Settings = lazy(() => import('./pages/Settings'));

function Home() {
  const { user } = useAuth();
  return user.role === 'CITIZEN' ? <CitizenDashboard /> : <Dashboard />;
}
const only = (roles, el) => <ProtectedRoute roles={roles}>{el}</ProtectedRoute>;

export default function App() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Routes>
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Home />} />
          <Route path="village/profile" element={<VillageProfile />} />
          <Route path="village/info" element={only(OFFICIALS, <VillageInfo />)} />
          <Route path="plans" element={only(OFFICIALS, <Plans />)} />
          <Route path="works" element={<Works />} />
          <Route path="assets" element={<Assets />} />
          <Route path="finance/budget" element={only(MANAGERS, <Budget />)} />
          <Route path="finance/transactions" element={only(MANAGERS, <Transactions />)} />
          <Route path="finance/overview" element={only(MANAGERS, <FinanceOverview />)} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="citizens" element={only(OFFICIALS, <Citizens />)} />
          <Route path="grievances" element={only(OFFICIALS, <Grievances />)} />
          <Route path="grievances/new" element={<SubmitGrievance />} />
          <Route path="grievances/track" element={<TrackGrievance />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/:tab" element={<Reports />} />
          <Route path="users" element={only(['ADMIN'], <Users />)} />
          <Route path="settings" element={<Settings />} />
          <Route path="unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
