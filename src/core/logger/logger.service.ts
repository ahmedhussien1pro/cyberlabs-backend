import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Custom Logger Service using Winston
 * Provides structured logging with file rotation and multiple transports
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private logger!: winston.Logger;
  private context?: string;

  constructor(private configService: ConfigService) {
    this.initializeLogger();
  }

  /**
   * Initialize Winston logger with transports
   */
  private initializeLogger() {
    const logLevel = this.configService.get('LOG_LEVEL') || 'info';
    const logPath = this.configService.get('LOG_FILE_PATH') || './logs';
    const isProduction = this.configService.get('app.isProduction');

    // Ensure log directory exists
    if (isProduction && !fs.existsSync(logPath)) {
      fs.mkdirSync(logPath, { recursive: true });
    }

    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    );

    // Console format (colorized for development)
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, context, trace }) => {
        const ctx = context ? `[${context}]` : '';
        const msg = `${timestamp} ${level} ${ctx} ${message}`;
        return trace ? `${msg}\n${trace}` : msg;
      }),
    );

    // Transports
    const transports: winston.transport[] = [
      // Console transport
      new winston.transports.Console({
        format: consoleFormat,
      }),
    ];

    // File transports (only in production)
    if (isProduction) {
      transports.push(
        // Error logs
        new winston.transports.File({
          filename: path.join(logPath, 'error.log'),
          level: 'error',
          format: logFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        // Combined logs
        new winston.transports.File({
          filename: path.join(logPath, 'combined.log'),
          format: logFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      format: logFormat,
      transports,
      exitOnError: false,
    });
  }

  /**
   * Set context for logger
   */
  setContext(context: string) {
    this.context = context;
  }

  /**
   * Log a message
   */
  log(message: any, context?: string) {
    this.logger.info(message, { context: context || this.context });
  }

  /**
   * Log an error
   */
  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, {
      context: context || this.context,
      trace,
    });
  }

  /**
   * Log a warning
   */
  warn(message: any, context?: string) {
    this.logger.warn(message, { context: context || this.context });
  }

  /**
   * Log debug information
   */
  debug(message: any, context?: string) {
    this.logger.debug(message, { context: context || this.context });
  }

  /**
   * Log verbose information
   */
  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context: context || this.context });
  }

  /**
   * Log HTTP requests
   */
  http(message: any, context?: string) {
    this.logger.http(message, { context: context || this.context });
  }

  /**
   * Log with custom metadata
   */
  logWithMeta(level: string, message: string, meta: Record<string, any>) {
    this.logger.log(level, message, meta);
  }

  /**
   * Get the Winston logger instance (for advanced usage)
   */
  getWinstonLogger(): winston.Logger {
    return this.logger;
  }
}
