import { Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ResourcePage } from '../components/ui/ResourcePage';
import { StatusBadge, Badge } from '../components/ui/Badge';
import { WhatsAppButton } from '../components/ui/WhatsAppButton';
import { isAdmin, isManager } from '../utils/roles';
import { labelize } from '../utils/format';

const WARDS = ['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5', 'Ward 6'].map((w) => ({ value: w, label: w }));

export default function Citizens() {
  const { user } = useAuth();
  const manage = isManager(user);
  const fields = [
    { name: 'name', label: 'Full name', required: true },
    { name: 'phone', label: 'Mobile', pattern: /^[0-9+\-\s]{7,15}$/, patternMessage: 'Enter a valid mobile number' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'ward', label: 'Ward', type: 'select', options: WARDS },
    { name: 'gender', label: 'Gender', type: 'select', options: ['MALE', 'FEMALE', 'OTHER'] },
    { name: 'status', label: 'Status', type: 'select', options: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', required: true },
    { name: 'address', label: 'Address', type: 'textarea', span: 2 },
  ];
  const columns = [
    { key: 'name', label: 'Name', primary: true, render: (r) => <span className="font-medium text-slate-900">{r.name}</span> },
    { key: 'ward', label: 'Ward' },
    { key: 'phone', label: 'Mobile & WhatsApp', render: (r) => (
      <div className="flex items-center gap-2">
        <span>{r.phone || '—'}</span>
        {r.phone && (
          <WhatsAppButton 
            phone={r.phone} 
            message={`Hello ${r.name}, contacting you regarding South Thittankulam Village Panchayat citizen services.`} 
            label="WhatsApp Web" 
            size="sm" 
          />
        )}
      </div>
    )},
    { key: 'address', label: 'Address', hideOnMobile: true },
    { key: 'gender', label: 'Gender', hideOnMobile: true, render: (r) => labelize(r.gender) },
    { key: 'account', label: 'Portal account', render: (r) => (r.userId ? <Badge tone="gov">Registered</Badge> : <Badge>Walk-in</Badge>) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
  ];
  return (
    <ResourcePage title="Citizens" subtitle="Residents registry (demo records)" icon={Users} endpoint="/citizens" entityName="citizen"
      columns={columns} formFields={manage ? fields : undefined} filters={[{ name: 'ward', label: 'Wards', options: WARDS }, { name: 'status', label: 'Statuses', options: ['ACTIVE', 'INACTIVE'] }]}
      searchPlaceholder="Search name, phone, address…" canCreate={manage} canEdit={manage} canDelete={isAdmin(user)} pageSize={15}
      csv={[{ label: 'Name', value: (r) => r.name }, { label: 'Ward', value: (r) => r.ward }, { label: 'Phone', value: (r) => r.phone }, { label: 'Address', value: (r) => r.address }, { label: 'Status', value: (r) => r.status }]} />
  );
}
