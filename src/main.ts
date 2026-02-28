import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { LoggerService } from './core/logger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);
  logger.setContext('Bootstrap');

  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  app.use(helmet());
  app.use(cookieParser());

  // ─── CORS ─────────────────────────────────────────────────────────────────
  const env = configService.get<string>('app.env') ?? 'production';
  const corsDomain = configService.get<string>('app.corsDomain'); // e.g. cyber-labs.tech
  const legacyUrl = configService.get<string>('app.frontendUrl'); // fallback
  const allowLocalhost = process.env.CORS_ALLOW_LOCALHOST === 'true'; // explicit flag for Vercel

  const patterns: RegExp[] = [];

  if (corsDomain) {
    const escaped = corsDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // [\w.-]+ supports multi-level subdomains:
    //   www.test.cyber-labs.tech  ✓
    //   labs-test.cyber-labs.tech ✓
    //   cyber-labs.tech           ✓
    patterns.push(new RegExp(`^https?:\\/\\/([\\w.-]+\\.)?${escaped}$`));
    logger.log(`🌐 CORS domain   : *.${corsDomain}`);
  }

  if (legacyUrl) {
    const clean = legacyUrl.trim().replace(/\/+$/, '');
    const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    patterns.push(new RegExp(`^${escaped}$`));
    logger.log(`🌐 CORS legacy   : ${clean}`);
  }

  if (allowLocalhost || env !== 'production') {
    patterns.push(/^http:\/\/localhost(:\d+)?$/);
    logger.log(`🌐 CORS localhost : http://localhost:* (enabled)`);
  }

  if (patterns.length === 0) {
    logger.warn(
      '⚠️  No CORS origins configured! Set CORS_DOMAIN or FRONTEND_URL.',
    );
  }

  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) return callback(null, true); // server-to-server / curl

      const clean = requestOrigin.trim().replace(/\/+$/, '');
      const allowed = patterns.some((p) => p.test(clean));

      if (allowed) return callback(null, true);

      logger.warn(`🚫 CORS blocked: ${requestOrigin}`);
      return callback(new Error(`CORS blocked: ${requestOrigin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
    ],
  });
  // ─────────────────────────────────────────────────────────────────────────

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port =
    process.env.PORT || configService.get<number>('app.port') || 8080;
  await app.listen(port);

  logger.log(`🚀 Running  : http://localhost:${port}/${apiPrefix}`);
  logger.log(`📚 Health   : http://localhost:${port}/${apiPrefix}/health`);
  logger.log(`🔒 Env      : ${env}`);
}

bootstrap();
