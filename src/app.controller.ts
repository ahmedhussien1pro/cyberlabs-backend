import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './core/database';
import { LoggerService } from './core/logger';
import { HashingService } from './core/security/hashing.service';
import { EncryptionService } from './core/security/encryption.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly hashing: HashingService,
    private readonly encryption: EncryptionService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async healthCheck() {
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
      };
    }
  }

  @Get('test-logger')
  testLogger() {
    this.logger.log('This is a log message');
    this.logger.error('This is an error message', 'Stack trace here');
    this.logger.warn('This is a warning message');
    this.logger.debug('This is a debug message');
    this.logger.http('This is an HTTP log');

    return { message: 'Check logs directory' };
  }

  @Get('test-security')
  async testSecurity() {
    const password = 'MySecurePassword123!';

    // Test hashing
    const hashedPassword = await this.hashing.hash(password);
    const isMatch = await this.hashing.compare(password, hashedPassword);

    // Test encryption
    const secretData = 'Sensitive information';
    const encrypted = this.encryption.encrypt(secretData);
    const decrypted = this.encryption.decrypt(encrypted);

    return {
      hashing: {
        original: password,
        hashed: hashedPassword,
        isMatch,
      },
      encryption: {
        original: secretData,
        encrypted,
        decrypted,
      },
    };
  }
}
