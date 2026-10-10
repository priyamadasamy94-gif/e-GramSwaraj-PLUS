import { Link } from 'react-router-dom';
import { ShieldAlert, MapPinOff } from 'lucide-react';

function ErrorPage({ icon: Icon, code, title, message }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full bg-gov-50 p-4"><Icon className="h-10 w-10 text-gov-700" /></div>
      <p className="mt-4 text-sm font-semibold text-saffron-600">{code}</p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 max-w-md text-slate-500">{message}</p>
      <Link to="/" className="btn-primary mt-6">Go to dashboard</Link>
    </div>
  );
}
export const NotFound = () => <ErrorPage icon={MapPinOff} code="404" title="Page not found" message="The page you are looking for does not exist or has moved." />;
export const Unauthorized = () => <ErrorPage icon={ShieldAlert} code="403" title="Access restricted" message="Your role does not have permission to view this page. Contact the Panchayat administrator if you need access." />;
