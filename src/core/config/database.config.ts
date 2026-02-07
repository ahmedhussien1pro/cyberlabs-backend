import { registerAs } from '@nestjs/config';

/**
 * Database Configuration
 * PostgreSQL and Prisma settings
 */
export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,

  // Connection pool settings
  pool: {
    min: Number(process.env.DB_POOL_MIN) || 2,
    max: Number(process.env.DB_POOL_MAX) || 10,
    idleTimeout: Number(process.env.DB_POOL_IDLE_TIMEOUT) || 10000,
  },

  // Logging
  logging: process.env.NODE_ENV === 'production',

  // Slow query threshold (in ms)
  slowQueryThreshold: 1000,
}));
