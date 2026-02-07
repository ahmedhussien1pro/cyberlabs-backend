import * as Joi from 'joi';

/**
 * Environment Variables Validation Schema
 * Validates all required environment variables at application startup
 * Ensures type safety and proper configuration
 */
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(3000),
  APP_NAME: Joi.string().default('CyberLabs'),
  APP_URL: Joi.string().uri().required(),
  API_PREFIX: Joi.string().default('api'),
  API_VERSION: Joi.string().default('v1'),

  // Database
  DATABASE_URL: Joi.string().required(),
  DB_POOL_MIN: Joi.number().default(2),
  DB_POOL_MAX: Joi.number().default(10),
  DB_POOL_IDLE_TIMEOUT: Joi.number().default(10000),

  // JWT Authentication
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
  JWT_VERIFICATION_SECRET: Joi.string().min(32).required(),
  JWT_VERIFICATION_EXPIRATION: Joi.string().default('24h'),
  JWT_PASSWORD_RESET_SECRET: Joi.string().min(32).required(),
  JWT_PASSWORD_RESET_EXPIRATION: Joi.string().default('1h'),

  // OAuth - Google
  GOOGLE_CLIENT_ID: Joi.string().allow(''),
  GOOGLE_CLIENT_SECRET: Joi.string().allow(''),
  GOOGLE_CALLBACK_URL: Joi.string().uri().allow(''),

  // OAuth - GitHub
  GITHUB_CLIENT_ID: Joi.string().allow(''),
  GITHUB_CLIENT_SECRET: Joi.string().allow(''),
  GITHUB_CALLBACK_URL: Joi.string().uri().allow(''),

  // AWS S3
  AWS_ACCESS_KEY_ID: Joi.string().allow(''),
  AWS_SECRET_ACCESS_KEY: Joi.string().allow(''),
  AWS_REGION: Joi.string().default('us-east-1'),
  AWS_S3_BUCKET: Joi.string().allow(''),
  AWS_S3_ENDPOINT: Joi.string().uri().allow(''),

  // File Upload
  UPLOAD_STORAGE: Joi.string().valid('s3', 'local').default('local'),
  UPLOAD_MAX_SIZE: Joi.number().default(10485760), // 10MB
  UPLOAD_ALLOWED_TYPES: Joi.string().default(
    'image/jpeg,image/png,image/gif,application/pdf',
  ),

  // Email
  MAIL_DRIVER: Joi.string().valid('smtp', 'sendgrid', 'ses').default('smtp'),
  MAIL_HOST: Joi.string().allow(''),
  MAIL_PORT: Joi.number().default(587),
  MAIL_USERNAME: Joi.string().allow(''),
  MAIL_PASSWORD: Joi.string().allow(''),
  MAIL_FROM_ADDRESS: Joi.string().email().allow(''),
  MAIL_FROM_NAME: Joi.string().default('CyberLabs'),

  // Redis (for caching & sessions)
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow(''),
  REDIS_DB: Joi.number().default(0),

  // Rate Limiting
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(10),

  // Security
  BCRYPT_ROUNDS: Joi.number().default(12),
  ENCRYPTION_KEY: Joi.string().length(32).required(),
  ENCRYPTION_IV_LENGTH: Joi.number().default(16),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info'),
  LOG_FILE_PATH: Joi.string().default('./logs'),

  // Frontend URL (for CORS)
  FRONTEND_URL: Joi.string().uri().required(),

  // Two-Factor Authentication
  TWO_FACTOR_APP_NAME: Joi.string().default('CyberLabs'),

  // Gamification
  XP_PER_LEVEL: Joi.number().default(1000),
  POINTS_TO_XP_RATIO: Joi.number().default(10),

  // Subscription (Stripe)
  STRIPE_SECRET_KEY: Joi.string().allow(''),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow(''),
  STRIPE_PUBLISHABLE_KEY: Joi.string().allow(''),
});
