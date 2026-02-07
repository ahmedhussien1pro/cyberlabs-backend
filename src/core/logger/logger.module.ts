import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

/**
 * Logger Module
 * Global module providing logging across the application
 */
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
