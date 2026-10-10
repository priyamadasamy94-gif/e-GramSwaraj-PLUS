/**
 * WhatsApp Web Direct Messaging Integration Utility
 */

export function formatWhatsAppPhone(phone) {
  if (!phone) return '';
  // Strip non-digit characters
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';

  // Standard Indian 10-digit phone number handling
  if (digits.length === 10) {
    digits = '91' + digits;
  }
  return digits;
}

export function getWhatsAppWebUrl(phone, text = '') {
  const formattedPhone = formatWhatsAppPhone(phone) || '916381746557';
  const encodedText = encodeURIComponent(text);

  return `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
}

export function getWhatsAppUniversalUrl(phone, text = '') {
  const formattedPhone = formatWhatsAppPhone(phone) || '916381746557';
  const encodedText = encodeURIComponent(text);
  
  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
}

export function openWhatsAppWeb(phone, text = '') {
  const webUrl = getWhatsAppWebUrl(phone || '916381746557', text);
  // Open in new tab/window targeting WhatsApp Web directly
  window.open(webUrl, '_blank', 'noopener,noreferrer');
}
