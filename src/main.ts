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
  });

  // Get services
  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);
  logger.setContext('Bootstrap');

  // Global prefix
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Security
  app.use(helmet());
  app.use(cookieParser());

  // ─── CORS ──────────────────────────────────────────────────────────
  const rawFrontendUrls =
    configService.get<string>('app.frontendUrl') || 'http://localhost:5173';

  const allowedOrigins = rawFrontendUrls
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  logger.log(`Allowed CORS origins: ${allowedOrigins.join(' | ')}`);

  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) return callback(null, true);

      const normalized = requestOrigin.trim().replace(/\/+$/, '');

      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }

      logger.warn(`🚫 CORS blocked: ${requestOrigin}`);
      return callback(
        new Error(`CORS blocked for origin: ${requestOrigin}`),
        false,
      );
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
  // ───────────────────────────────────────────────────────────────────

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Start server
  const port =
    process.env.PORT || configService.get<number>('app.port') || 8080;
  await app.listen(port);

  logger.log(
    `🚀 Application is running on: http://localhost:${port}/${apiPrefix}`,
  );
  logger.log(`📚 Health Check: http://localhost:${port}/${apiPrefix}/health`);
  logger.log(`🔒 Environment: ${configService.get<string>('app.env')}`);
}

bootstrap();
