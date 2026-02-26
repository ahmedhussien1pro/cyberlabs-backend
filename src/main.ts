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

  // ─── CORS ──────────────────────────────────────────────
  const rawFrontendUrls =
    configService.get<string>('app.frontendUrl') || 'http://localhost:5173';

  const allowedOrigins = rawFrontendUrls
    .split(',')
    .map((u) => u.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  logger.log(`🌐 CORS origins: ${allowedOrigins.join(' | ')}`);

  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) return callback(null, true);
      const clean = requestOrigin.trim().replace(/\/+$/, '');
      if (allowedOrigins.includes(clean)) return callback(null, true);
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
  // ───────────────────────────────────────────────────────

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

  logger.log(`🚀 Running: http://localhost:${port}/${apiPrefix}`);
  logger.log(`📚 Health: http://localhost:${port}/${apiPrefix}/health`);
  logger.log(`🔒 Env: ${configService.get<string>('app.env')}`);
}

bootstrap();
