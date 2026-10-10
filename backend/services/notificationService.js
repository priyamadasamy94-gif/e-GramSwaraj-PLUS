const nodemailer = require('nodemailer');
const { Notification, User, Citizen } = require('../models');

function getNotificationSettings() {
  return {
    email: {
      provider: process.env.EMAIL_PROVIDER || 'smtp',
      host: process.env.EMAIL_HOST || '',
      port: Number(process.env.EMAIL_PORT) || 587,
      user: process.env.EMAIL_USER || '',
      password: process.env.EMAIL_PASSWORD || '',
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || '',
    },
    sms: {
      provider: process.env.SMS_PROVIDER || '',
      apiKey: process.env.SMS_API_KEY || '',
      senderId: process.env.SMS_SENDER_ID || '',
    },
    whatsapp: {
      provider: process.env.WHATSAPP_PROVIDER || (process.env.WHATSAPP_ACCESS_TOKEN ? 'meta' : ''),
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v19.0',
      templateName: process.env.WHATSAPP_TEMPLATE_NAME || '',
    },
  };
}

const EVENT_TEMPLATES = {
  REGISTRATION_OTP: {
    sms: 'Your eGramSwaraj Plus verification OTP is {otp}. It is valid for 5 minutes. Do not share this OTP with anyone.',
    whatsapp: 'Your eGramSwaraj Plus verification OTP is {otp}. It is valid for 5 minutes. Do not share this OTP with anyone.',
    email: 'Your eGramSwaraj Plus verification OTP has been generated. Please use it to complete your citizen registration.',
  },
  REGISTRATION_SUCCESS: {
    sms: 'Your eGramSwaraj Plus citizen account has been successfully registered.',
    whatsapp: 'Welcome to eGramSwaraj Plus. Your citizen account has been successfully registered.',
    email: 'Your eGramSwaraj Plus citizen account has been successfully registered.',
  },
  APPLICATION_SUBMITTED: {
    sms: 'Your application has been submitted successfully. We will update you on its progress.',
    whatsapp: 'Your application has been submitted successfully. We will keep you informed.',
    email: 'Your application has been submitted successfully.',
  },
  APPLICATION_APPROVED: {
    sms: 'Your application has been approved.',
    whatsapp: 'Your application has been approved.',
    email: 'Your application has been approved.',
  },
  APPLICATION_REJECTED: {
    sms: 'Your application requires attention. Please review the update in your portal.',
    whatsapp: 'Your application requires attention. Please review the update in your portal.',
    email: 'Your application requires attention. Please review the update in your portal.',
  },
  COMPLAINT_REGISTERED: {
    sms: 'Your complaint has been registered. You can track its status in the portal.',
    whatsapp: 'Your complaint has been registered. You can track its status in the portal.',
    email: 'Your complaint has been registered successfully.',
  },
  COMPLAINT_STATUS_UPDATED: {
    sms: 'Your complaint status has been updated. Please check the portal for details.',
    whatsapp: 'Your complaint status has been updated. Please check the portal for details.',
    email: 'Your complaint status has been updated. Please check the portal for details.',
  },
  GRIEVANCE_RESOLVED: {
    sms: 'Your grievance has been resolved. Please check the portal for details.',
    whatsapp: 'Your grievance has been resolved. Please check the portal for details.',
    email: 'Your grievance has been resolved. Please check the portal for details.',
  },
};

function maskPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return 'unknown';
  if (digits.length <= 4) return `******${digits}`;
  return `******${digits.slice(-4)}`;
}

function normalizeChannelList(channels) {
  if (!channels || !channels.length) return ['whatsapp', 'email'];
  return Array.from(new Set(channels.map((channel) => String(channel).toLowerCase())));
}

function resolveMessage(eventType, channel, fallbackMessage, data = {}) {
  const template = EVENT_TEMPLATES[eventType]?.[channel] || fallbackMessage;
  if (!template) return fallbackMessage;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = data?.[key];
    return value == null ? '' : String(value);
  });
}

async function notifyUser(villageId, userId, payload) {
  try {
    return await Notification.create({ villageId, userId, ...payload });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') return null;
    throw error;
  }
}

async function notifyVillage(villageId, payload, roles) {
  const filter = { villageId, status: 'ACTIVE' };
  if (roles && roles.length) filter.role = { $in: roles };
  const users = await User.find(filter).select('_id');
  const docs = users.map((u) => ({ villageId, userId: u._id, ...payload, dedupeKey: payload.dedupeKey ? `${payload.dedupeKey}` : undefined }));
  if (!docs.length) return 0;
  try {
    const res = await Notification.insertMany(docs, { ordered: false });
    return res.length;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError' || error.name === 'AggregateError') return 0;
    throw error;
  }
}

class NotificationService {
  static async sendSMS({ to, message, otp }) {
    const { sms } = getNotificationSettings();
    if (!sms.provider) {
      const fallbackMessage = otp ? `Your eGramSwaraj Plus verification OTP is ${otp}. It is valid for 5 minutes. Do not share this OTP with anyone.` : message;
      console.warn('[sms] SMS provider is not configured; skipping delivery because OTP is enabled without SMS.');
      return { provider: 'none', status: 'skipped', reason: 'provider-not-configured', to, message: fallbackMessage };
    }

    const providerName = String(sms.provider).toLowerCase();
    const payloadMessage = otp ? `Your eGramSwaraj Plus verification OTP is ${otp}. It is valid for 5 minutes. Do not share this OTP with anyone.` : message;

    if (providerName === 'mock' || providerName === 'test') {
      console.info(`[sms] ${maskPhone(to)} — mock delivery accepted.`);
      return { provider: providerName, status: 'sent', to, message: payloadMessage };
    }

    const smsApiUrl = process.env.SMS_API_URL || '';
    if (!smsApiUrl) {
      console.warn('[sms] SMS provider URL is not configured; skipping live delivery.');
      return { provider: providerName, status: 'skipped', reason: 'provider-url-missing', to, message: payloadMessage };
    }

    const response = await fetch(smsApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        text: payloadMessage,
        senderId: sms.senderId || '',
        apiKey: sms.apiKey || '',
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`SMS provider returned ${response.status}: ${text}`);
    }

    console.info(`[sms] OTP sent successfully to masked number ${maskPhone(to)}`);
    return { provider: providerName, status: 'sent', to, message: payloadMessage };
  }

  static async sendWhatsApp({ to, message, otp, templateName, templateData = {} }) {
    const { whatsapp } = getNotificationSettings();
    const providerName = String(whatsapp.provider || '').toLowerCase();

    const rawTo = String(to || '').replace(/\D/g, '');
    const cleanTo = rawTo.length === 10 ? `91${rawTo}` : rawTo;
    const payloadMessage = otp ? `Your eGramSwaraj Plus verification OTP is ${otp}. It is valid for 5 minutes. Do not share this OTP with anyone.` : message;

    if (providerName === 'web' || providerName === 'mock' || providerName === 'test') {
      const webUrl = `https://web.whatsapp.com/send?phone=${cleanTo}&text=${encodeURIComponent(payloadMessage)}`;
      const waMeUrl = `https://wa.me/${cleanTo}?text=${encodeURIComponent(payloadMessage)}`;
      console.info(`\n[whatsapp] 📲 WHATSAPP WEB LINK GENERATED FOR ${maskPhone(to)}:`);
      console.info(`[whatsapp] Web: ${webUrl}`);
      console.info(`[whatsapp] Direct (App/Mobile): ${waMeUrl}\n`);
      return { provider: providerName, status: 'sent', to, message: payloadMessage, webUrl, waMeUrl };
    }

    if (!whatsapp.provider || !whatsapp.accessToken || !whatsapp.phoneNumberId) {
      console.warn('[whatsapp] Meta WhatsApp provider is not configured. Skipping message delivery.');
      return { provider: 'meta', status: 'skipped', reason: 'provider-not-configured', to };
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: cleanTo,
      type: 'text',
    };

    const templateMessage = templateName || whatsapp.templateName;
    if (templateMessage && providerName === 'meta') {
      payload.type = 'template';
      payload.template = {
        name: templateMessage,
        language: { code: 'en_US' },
      };
      if (otp || templateData.otp) {
        payload.template.components = [
          { type: 'body', parameters: [{ type: 'text', text: String(otp || templateData.otp) }] },
        ];
      }
    } else {
      payload.text = { body: payloadMessage };
    }

    const url = `https://graph.facebook.com/${whatsapp.apiVersion}/${whatsapp.phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${whatsapp.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`WhatsApp provider returned ${response.status}: ${text}`);
    }

    return { provider: providerName, status: 'sent', to, message: otp ? `OTP sent to ${maskPhone(to)}` : message };
  }

  static async sendEmail({ to, subject, text, html }) {
    const { email } = getNotificationSettings();
    const providerName = String(email.provider || 'smtp').toLowerCase();

    if (providerName === 'mock') {
      console.info(`[email] ${to} — mock email delivery accepted.`);
      return { provider: 'mock', status: 'sent', to };
    }

    if (providerName === 'ethereal') {
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      const info = await transporter.sendMail({ from: '"eGramSwaraj Plus" <no-reply@egramswaraj.gov.in>', to, subject, text, html });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.info(`[email] Ethereal Email Preview URL: ${previewUrl}`);
      return { provider: 'ethereal', status: 'sent', previewUrl, to };
    }

    if (!email.host || !email.user || !email.password) {
      const error = new Error('Email provider is not configured. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, and EMAIL_FROM in the environment.');
      error.code = 'EMAIL_NOT_CONFIGURED';
      throw error;
    }

    const transporter = nodemailer.createTransport({
      host: email.host,
      port: Number(email.port) || 587,
      secure: Number(email.port) === 465,
      auth: {
        user: email.user,
        pass: email.password,
      },
    });

    const response = await transporter.sendMail({
      from: email.from || email.user,
      to,
      subject,
      text,
      html,
    });

    return { provider: 'smtp', status: 'sent', response, to };
  }

  static async notifyCitizen({ user, citizen, eventType = 'REGISTRATION_SUCCESS', channels = ['sms', 'whatsapp', 'email'], title, message, data = {} }) {
    const targetUser = user || (citizen ? await User.findById(citizen.userId) : null);
    const targetCitizen = citizen || (targetUser ? await Citizen.findOne({ userId: targetUser._id }) : null);
    const phone = targetUser?.phone || targetCitizen?.phone;
    const emailAddress = targetUser?.email || targetCitizen?.email;

    if (targetUser && targetUser._id) {
      try {
        await Notification.create({
          villageId: targetUser.villageId || targetCitizen?.villageId,
          userId: targetUser._id,
          title: title || eventType,
          message: message || resolveMessage(eventType, 'sms', eventType, data),
          type: 'SYSTEM',
          dedupeKey: `${eventType}:${targetUser._id}`,
        });
      } catch (error) {
        if (error.name !== 'SequelizeUniqueConstraintError') {
          console.warn('[notification] Database notification write failed safely.', error.message);
        }
      }
    }

    const results = [];
    for (const channel of normalizeChannelList(channels)) {
      try {
        if (channel === 'sms' && phone) {
          results.push(await NotificationService.sendSMS({
            to: phone,
            message: resolveMessage(eventType, 'sms', message || eventType, data),
            otp: data.otp,
          }));
        }
        if (channel === 'whatsapp' && phone) {
          results.push(await NotificationService.sendWhatsApp({
            to: phone,
            message: resolveMessage(eventType, 'whatsapp', message || eventType, data),
            otp: data.otp,
            templateName: data.templateName,
            templateData: data,
          }));
        }
        if (channel === 'email' && emailAddress) {
          results.push(await NotificationService.sendEmail({
            to: emailAddress,
            subject: title || eventType,
            text: resolveMessage(eventType, 'email', message || eventType, data),
            html: `<p>${resolveMessage(eventType, 'email', message || eventType, data)}</p>`,
          }));
        }
      } catch (error) {
        console.warn(`[notification] ${channel} delivery failed safely for ${maskPhone(phone || emailAddress || 'unknown')}:`, error.message);
        if (channel === 'sms' && (eventType === 'REGISTRATION_OTP' || eventType === 'REGISTRATION_SUCCESS')) {
          throw error;
        }
      }
    }

    return results;
  }
}

module.exports = {
  NotificationService,
  notifyUser,
  notifyVillage,
  EVENT_TEMPLATES,
};
