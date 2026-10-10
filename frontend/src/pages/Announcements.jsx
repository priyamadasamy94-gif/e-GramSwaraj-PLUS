import { Megaphone, Pin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useOptions } from '../context/OptionsContext';
import { ResourcePage } from '../components/ui/ResourcePage';
import { StatusBadge } from '../components/ui/Badge';
import { WhatsAppButton } from '../components/ui/WhatsAppButton';
import { openWhatsAppWeb } from '../utils/whatsapp';
import { formatDate } from '../utils/format';
import { isManager, isCitizen } from '../utils/roles';

function buildAnnouncementWhatsAppText(a) {
  const categoryLabel = a.category ? a.category.replace(/_/g, ' ') : 'PUBLIC INFORMATION';
  const header = a.category === 'EMERGENCY' ? '🚨 *EMERGENCY ANNOUNCEMENT*' : '📢 *PANCHAYAT ANNOUNCEMENT*';
  
  let msg = `${header}\n*${a.title}*\n`;
  msg += `📍 *South Thittankulam Village Panchayat* [${categoryLabel}]\n`;
  msg += `📅 Published: ${formatDate(a.publishDate)}\n\n`;
  msg += `${a.description}\n`;
  if (a.expiryDate) {
    msg += `\n⏳ Valid Until: ${formatDate(a.expiryDate)}`;
  }
  msg += `\n\n— Sourced from E-GramSwaraj+ Digital Governance Portal`;
  return msg;
}

export default function Announcements() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const o = useOptions();
  const manage = isManager(user);
  const fields = [
    { name: 'title', label: t('common.title', 'Title'), required: true, span: 2 },
    { name: 'category', label: t('category', 'Category'), type: 'select', options: o.announcementCategories, required: true, default: 'PUBLIC_INFORMATION' },
    { name: 'status', label: t('status', 'Status'), type: 'select', options: o.announcementStatuses, required: true, default: 'PUBLISHED', help: t('announcements.publishHelp', 'Publishing automatically notifies all users and launches WhatsApp Web broadcast.') },
    { name: 'publishDate', label: t('announcements.publishDate', 'Publish date'), type: 'date', get: (r) => r.publishDate || new Date() },
    { name: 'expiryDate', label: t('announcements.expiryDate', 'Expiry date (optional)'), type: 'date', nullable: true },
    { name: 'description', label: t('announcements.message', 'Message'), type: 'textarea', required: true, span: 2, rows: 5 },
    { name: 'pinned', label: t('announcements.pinToTop', 'Pin to top'), type: 'checkbox', span: 2 },
  ];

  const handleAfterSave = (announcement) => {
    // Automatically launch WhatsApp Web pre-loaded with announcement message
    const msg = buildAnnouncementWhatsAppText(announcement);
    openWhatsAppWeb('', msg);
  };

  const columns = [
    { key: 'title', label: t('announcements.title', 'Announcement'), primary: true, render: (r) => <div><p className="flex items-center gap-1 font-medium text-slate-900">{r.pinned && <Pin className="h-3.5 w-3.5 text-saffron-600" aria-label={t('announcements.pinned', 'Pinned')} />}{r.title}</p><p className="line-clamp-1 text-xs text-slate-500">{r.description}</p></div> },
    { key: 'category', label: t('category', 'Category'), render: (r) => <StatusBadge value={r.category} /> },
    { key: 'publishDate', label: t('announcements.published', 'Published'), render: (r) => formatDate(r.publishDate) },
    { key: 'expiryDate', label: t('announcements.expires', 'Expires'), hideOnMobile: true, render: (r) => formatDate(r.expiryDate) },
    { key: 'status', label: t('status', 'Status'), render: (r) => <StatusBadge value={r.status} /> },
  ];

  const extraActions = (a) => (
    <WhatsAppButton
      phone=""
      message={buildAnnouncementWhatsAppText(a)}
      label="WhatsApp Broadcast"
      size="sm"
      variant="secondary"
    />
  );

  const feed = {
    feed: {
      label: t('announcements.noticeBoard', 'Notice board'),
      render: (rows, { rowActions }) => (
        <div className="grid gap-4 p-4 md:grid-cols-2">
          {rows.map((a) => (
            <article key={a._id} className={`rounded-lg border p-4 flex flex-col justify-between ${a.category === 'EMERGENCY' ? 'border-red-300 bg-red-50/50' : 'border-slate-200'}`}>
              <div>
                <div className="flex flex-wrap items-center gap-2"><StatusBadge value={a.category} />{a.pinned && <span className="inline-flex items-center gap-1 text-xs font-medium text-saffron-600"><Pin className="h-3 w-3" /> {t('announcements.pinned', 'Pinned')}</span>}<span className="text-xs text-slate-500">{formatDate(a.publishDate)}</span></div>
                <h3 className="mt-2 font-semibold text-slate-900">{a.title}</h3>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{a.description}</p>
                {a.expiryDate && <p className="mt-2 text-xs text-slate-500">{t('announcements.validUntil', 'Valid until')} {formatDate(a.expiryDate)}</p>}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <WhatsAppButton
                  phone=""
                  message={buildAnnouncementWhatsAppText(a)}
                  label="Broadcast via WhatsApp Web"
                  size="sm"
                  variant="primary"
                />
                {rowActions && <div>{rowActions(a)}</div>}
              </div>
            </article>
          ))}
        </div>
      ),
    },
  };

  return (
    <ResourcePage title={t('announcements.title', 'Announcements')} subtitle={t('announcements.subtitle', 'Government notices, Gram Sabha notices, development updates, events and emergencies')} icon={Megaphone}
      endpoint="/announcements" entityName="announcement" columns={columns} formFields={manage ? fields : undefined} views={feed} defaultView={isCitizen(user) ? 'feed' : 'table'}
      filters={[{ name: 'category', label: t('categories.label', 'Categories'), options: o.announcementCategories }, ...(manage ? [{ name: 'status', label: t('statuses.label', 'Statuses'), options: o.announcementStatuses }] : [])]}
      dateRange={t('announcements.publishDate', 'Publish date')} searchPlaceholder={t('announcements.searchPlaceholder', 'Search announcements…')} canCreate={manage} canEdit={manage} canDelete={manage}
      extraActions={extraActions} onAfterSave={handleAfterSave} />
  );
}
