import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../src/app.module';
import { LoggerService } from '../src/core/logger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

let cachedApp;

async function bootstrap() {
  if (!cachedApp) {
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

    app.enableCors({
      origin: (requestOrigin, callback) => {
        if (!requestOrigin) return callback(null, true);
        const clean = requestOrigin.trim().replace(/\/+$/, '');
        if (allowedOrigins.includes(clean)) return callback(null, true);
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

    await app.init();
    cachedApp = app.getHttpAdapter().getInstance();
  }
  return cachedApp;
}

export default async function handler(req, res) {
  const app = await bootstrap();
  return app(req, res);
}
