import { UserCog } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOptions } from '../context/OptionsContext';
import { ResourcePage } from '../components/ui/ResourcePage';
import { StatusBadge } from '../components/ui/Badge';
import { WhatsAppButton } from '../components/ui/WhatsAppButton';
import { formatDate, ROLE_LABELS } from '../utils/format';

export default function Users() {
  const { user } = useAuth();
  const o = useOptions();
  const roleOpts = (o.roles || []).map((r) => ({ value: r, label: ROLE_LABELS[r] }));
  const fields = [
    { name: 'name', label: 'Full name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'role', label: 'Role', type: 'select', options: roleOpts, required: true, default: 'STAFF' },
    { name: 'status', label: 'Status', type: 'select', options: o.userStatuses, required: true, default: 'ACTIVE' },
    { name: 'phone', label: 'Mobile' },
    { name: 'designation', label: 'Designation' },
    { name: 'password', label: 'Password', type: 'password', minLength: 8, help: 'Required for new users. Leave blank to keep the current password.', autoComplete: 'new-password' },
  ];
  const columns = [
    { key: 'name', label: 'Name', primary: true, render: (r) => <div><p className="font-medium text-slate-900">{r.name}{r._id === user._id && <span className="ml-1 text-xs text-slate-500">(you)</span>}</p><p className="text-xs text-slate-500">{r.email}</p></div> },
    { key: 'role', label: 'Role', render: (r) => <StatusBadge value={r.role} label={ROLE_LABELS[r.role]} /> },
    { key: 'designation', label: 'Designation', hideOnMobile: true },
    { key: 'phone', label: 'Mobile & WhatsApp', hideOnMobile: true, render: (r) => (
      <div className="flex items-center gap-2">
        <span>{r.phone || '—'}</span>
        {r.phone && (
          <WhatsAppButton 
            phone={r.phone} 
            message={`Hello ${r.name}, contacting you regarding South Thittankulam Village Panchayat administrative operations.`} 
            label="WhatsApp Web" 
            size="sm" 
          />
        )}
      </div>
    )},
    { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { key: 'lastLoginAt', label: 'Last login', render: (r) => formatDate(r.lastLoginAt, true) },
  ];
  return (
    <ResourcePage title="Users" subtitle="Portal accounts and role-based access" icon={UserCog} endpoint="/users" entityName="user" columns={columns}
      formFields={fields} filters={[{ name: 'role', label: 'Roles', options: roleOpts }, { name: 'status', label: 'Statuses', options: o.userStatuses }]}
      searchPlaceholder="Search name, email, phone…" canCreate canEdit canDelete pageSize={15}
      toFormItem={(r) => ({ ...r, password: '' })}
      deleteMessage={(r) => `Delete the account of ${r?.name}? Their citizen record (if any) is kept.`} />
  );
}
