import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'Production',
  port: Number(process.env.PORT) || 3000,
  name: process.env.APP_NAME || 'CyberLabs',
  url: process.env.APP_URL,
  apiPrefix: process.env.API_PREFIX || 'api',
  apiVersion: process.env.API_VERSION || 'v1',
  frontendUrl: process.env.FRONTEND_URL,

  // Environment checks
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'Production',
  isTest: process.env.NODE_ENV === 'test',
  isStaging: process.env.NODE_ENV === 'staging',

  // Gamification settings
  gamification: {
    xpPerLevel: Number(process.env.XP_PER_LEVEL) || 1000,
    pointsToXpRatio: Number(process.env.POINTS_TO_XP_RATIO) || 10,
  },
}));
