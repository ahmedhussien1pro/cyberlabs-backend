import { registerAs } from '@nestjs/config';

/**
 * Mail Configuration
 * Email sending settings
 */
export default registerAs('mail', () => ({
  driver: process.env.MAIL_DRIVER || 'smtp',

  smtp: {
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  },

  from: {
    address: process.env.MAIL_FROM_ADDRESS,
    name: process.env.MAIL_FROM_NAME || 'CyberLabs',
  },
}));
