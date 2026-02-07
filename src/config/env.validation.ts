import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),
  API_VERSION: Joi.string().default('v1'),

  // Database
  DATABASE_URL: Joi.string().required(),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
  JWT_VERIFICATION_SECRET: Joi.string().required(),
  JWT_PASSWORD_RESET_SECRET: Joi.string().required(),

  // OAuth
  GOOGLE_CLIENT_ID: Joi.string().allow('').optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().allow('').optional(),
  GOOGLE_REDIRECT_URI: Joi.string().allow('').optional(),

  GITHUB_CLIENT_ID: Joi.string().allow('').optional(),
  GITHUB_CLIENT_SECRET: Joi.string().allow('').optional(),
  GITHUB_CALLBACK_URL: Joi.string().allow('').optional(),

  // Email
  MAIL_USERNAME: Joi.string().optional(),
  MAIL_PASSWORD: Joi.string().optional(),
  MAIL_FROM_ADDRESS: Joi.string().email().optional(),
  MAIL_HOST: Joi.string().default('smtp.gmail.com'),
  MAIL_PORT: Joi.number().default(587),

  // Frontend
  FRONTEND_URL: Joi.string().required(),

  // Security
  BCRYPT_ROUNDS: Joi.number().default(12),
  ENCRYPTION_KEY: Joi.string().required(),

  // Storage
  R2_ACCOUNT_ID: Joi.string().optional(),
  R2_ACCESS_KEY_ID: Joi.string().optional(),
  R2_SECRET_ACCESS_KEY: Joi.string().optional(),
  R2_BUCKET_NAME: Joi.string().optional(),
  R2_PUBLIC_URL: Joi.string().optional(),

  // Rate Limiting
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),
});
