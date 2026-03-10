import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminCoursesController } from './admin-courses.controller';
import { AdminCoursesService } from './admin-courses.service';
import { AdminLabsController } from './admin-labs.controller';
import { AdminLabsService } from './admin-labs.service';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminPathsController } from './admin-paths.controller';
import { AdminPathsService } from './admin-paths.service';
import { AdminNotificationsController } from './admin-notifications.controller';
import { AdminNotificationsService } from './admin-notifications.service';
import { AdminBadgesController } from './admin-badges.controller';
import { AdminBadgesService } from './admin-badges.service';
import { NotificationsGateway } from '../notifications/gateways/notifications.gateway';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

/**
 * AdminModule
 *
 * Controllers:
 *   AdminController                → GET  /admin/health
 *   AdminUsersController           → GET/PATCH /admin/users/*
 *   AdminCoursesController         → GET/POST/PATCH/DELETE /admin/courses/*
 *   AdminLabsController            → GET/POST/PATCH/DELETE /admin/labs/*
 *   AdminPathsController           → GET/POST/PATCH/DELETE /admin/paths/*
 *   AdminAnalyticsController       → GET /admin/analytics/*
 *   AdminNotificationsController   → POST/GET /admin/notifications/*
 *   AdminBadgesController          → GET/POST/PATCH/DELETE /admin/badges/*
 */
@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({ secret: cfg.get('JWT_SECRET') }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AdminController,
    AdminUsersController,
    AdminCoursesController,
    AdminLabsController,
    AdminPathsController,
    AdminAnalyticsController,
    AdminNotificationsController,
    AdminBadgesController,
  ],
  providers: [
    AdminService,
    AdminUsersService,
    AdminCoursesService,
    AdminLabsService,
    AdminPathsService,
    AdminAnalyticsService,
    AdminNotificationsService,
    AdminBadgesService,
    NotificationsGateway,
  ],
})
export class AdminModule {}
