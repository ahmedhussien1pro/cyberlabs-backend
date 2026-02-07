import { registerAs } from '@nestjs/config';

/**
 * JWT Configuration
 * Tokens for authentication and authorization
 */
export default registerAs('jwt', () => ({
  // Access Token (short-lived)
  access: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: process.env.JWT_ACCESS_EXPIRATION || '30d',
  },

  // Refresh Token (long-lived)
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_REFRESH_EXPIRATION || '30d',
  },

  // Email Verification Token
  verification: {
    secret: process.env.JWT_VERIFICATION_SECRET,
    expiresIn: process.env.JWT_VERIFICATION_EXPIRATION || '72d',
  },

  // Password Reset Token
  passwordReset: {
    secret: process.env.JWT_PASSWORD_RESET_SECRET,
    expiresIn: process.env.JWT_PASSWORD_RESET_EXPIRATION || '7d',
  },
}));
