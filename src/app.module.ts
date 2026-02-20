import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { StorageModule } from './core/storage';

// Controllers
import { AppController } from './app.controller';

// Services
import { AppService } from './app.service';

// Core Modules
import { DatabaseModule } from './core/database';
import { LoggerModule } from './core/logger';
import { SecurityModule } from './core/security';

// Feature Modules
import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users';
import { EnrollmentsModule } from './modules/enrollments';
import { LabsModule } from './modules/labs';
import { ProgressModule } from './modules/progress';
import { PracticeLabsModule } from './modules/practice-labs/practice-labs.module';
import { ContactModule } from './modules/contact/contact.module';
// Guards
import { JwtAuthGuard } from './common/guards';

// Config
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { MailModule } from './core/mail';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '.env.local'],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: true,
        allowUnknown: true,
      },
    }),

    // Core Modules
    DatabaseModule,
    LoggerModule,
    SecurityModule,
    MailModule,
    StorageModule,
    // Feature Modules
    AuthModule,
    UsersModule,
    LabsModule,
    EnrollmentsModule,
    ProgressModule,
    PracticeLabsModule,
    ContactModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
