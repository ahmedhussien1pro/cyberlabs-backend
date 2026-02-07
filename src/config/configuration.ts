export default () => ({
  app: {
    name: process.env.APP_NAME || 'CyberLabs Backend',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: `${process.env.API_PREFIX}/${process.env.API_VERSION}`,
    url: process.env.APP_URL,
    frontendUrl: process.env.FRONTEND_URL,
  },

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    verificationSecret: process.env.JWT_VERIFICATION_SECRET,
    verificationExpiration: process.env.JWT_VERIFICATION_EXPIRATION || '24h',
    passwordResetSecret: process.env.JWT_PASSWORD_RESET_SECRET,
    passwordResetExpiration: process.env.JWT_PASSWORD_RESET_EXPIRATION || '1h',
  },

  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackUrl: process.env.GITHUB_CALLBACK_URL,
    },
  },

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    encryptionKey: process.env.ENCRYPTION_KEY,
    encryptionIvLength: parseInt(process.env.ENCRYPTION_IV_LENGTH || '16', 10),
  },

  email: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    secure: false,
    username: process.env.MAIL_USERNAME,
    password: process.env.MAIL_PASSWORD,
    from: process.env.MAIL_FROM_ADDRESS,
    fromName: process.env.MAIL_FROM_NAME || 'CyberLabs',
  },

  storage: {
    r2: {
      accountId: process.env.R2_ACCOUNT_ID,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      bucketName: process.env.R2_BUCKET_NAME,
      publicUrl: process.env.R2_PUBLIC_URL,
    },
  },

  rateLimit: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },

  gamification: {
    xpPerLevel: parseInt(process.env.XP_PER_LEVEL || '1000', 10),
    pointsToXpRatio: parseInt(process.env.POINTS_TO_XP_RATIO || '10', 10),
  },
});
