import { registerAs } from '@nestjs/config';

/**
 * Redis Configuration
 * For caching and sessions
 */
export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB) || 0,
  ttl: 60 * 60, // 1 hour default TTL
}));
