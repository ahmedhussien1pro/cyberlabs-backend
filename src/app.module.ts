import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { ProgressModule } from './modules/progress';
import { PracticeLabsModule } from './modules/practice-labs/practice-labs.module';
import { ContactModule } from './modules/contact/contact.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { GoalsModule } from './modules/goals/goals.module';
import { ProfileModule } from './modules/profile/profile.module';
import { CoursesModule } from './modules/courses/courses.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { PathsModule } from './modules/paths/paths.module';
import { BadgesModule } from './modules/badges/badges.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { SearchModule } from './modules/search';

// Admin Module
import { AdminModule } from './modules/admin';

// VM Labs Module
import { VmLabsModule } from './modules/vm-labs';

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

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: (config.get<number>('rateLimit.ttl') ?? 60) * 1000,
          limit: config.get<number>('rateLimit.limit') ?? 100,
        },
      ],
    }),

    // Core
    DatabaseModule,
    LoggerModule,
    SecurityModule,
    MailModule,
    StorageModule,

    // Features
    AuthModule,
    UsersModule,
    EnrollmentsModule,
    ProgressModule,
    PracticeLabsModule,
    ContactModule,
    NotificationsModule,
    DashboardModule,
    GoalsModule,
    ProfileModule,
    CoursesModule,
    PricingModule,
    PathsModule,
    SearchModule,

    // Gamification
    BadgesModule,
    CertificatesModule,

    // Tracking
    TrackingModule,

    // Admin
    AdminModule,

    // VM Labs
    VmLabsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
