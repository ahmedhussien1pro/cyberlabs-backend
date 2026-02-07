import { registerAs } from '@nestjs/config';

/**
 * Security Configuration
 * Encryption, hashing, and security settings
 */
export default registerAs('security', () => ({
  // Bcrypt
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,

  // Encryption
  encryptionKey: process.env.ENCRYPTION_KEY,
  encryptionIvLength: Number(process.env.ENCRYPTION_IV_LENGTH) || 16,

  // Rate Limiting
  throttle: {
    ttl: Number(process.env.THROTTLE_TTL) || 60, // seconds
    limit: Number(process.env.THROTTLE_LIMIT) || 10, // requests
  },

  // Two-Factor Authentication
  twoFactor: {
    appName: process.env.TWO_FACTOR_APP_NAME || 'CyberLabs',
  },
}));
