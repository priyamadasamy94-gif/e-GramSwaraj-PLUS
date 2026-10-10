require('../config/env');
const { NotificationService } = require('../services/notificationService');

(async () => {
  console.log('--- Testing WhatsApp Web Link Generation ---');
  const result = await NotificationService.sendWhatsApp({
    to: '9876543210',
    message: 'Welcome to E-GramSwaraj+ Digital Village Governance Portal!',
    otp: '123456',
  });
  console.log('Result object returned:', result);
})();
