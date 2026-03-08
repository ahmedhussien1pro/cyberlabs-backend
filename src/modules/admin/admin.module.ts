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

/**
 * AdminModule
 *
 * Central module for all platform administration features.
 * Each feature area is a dedicated controller + service pair sharing DatabaseModule.
 *
 * Controllers:
 *   AdminController           → GET  /admin/health
 *   AdminUsersController      → GET/PATCH /admin/users/*
 *   AdminCoursesController    → GET/POST/PATCH/DELETE /admin/courses/*
 *   AdminLabsController       → GET/POST/PATCH/DELETE /admin/labs/*
 *   AdminAnalyticsController  → GET /admin/analytics/*
 */
@Module({
  imports: [DatabaseModule],
  controllers: [
    AdminController,
    AdminUsersController,
    AdminCoursesController,
    AdminLabsController,
    AdminAnalyticsController,
  ],
  providers: [
    AdminService,
    AdminUsersService,
    AdminCoursesService,
    AdminLabsService,
    AdminAnalyticsService,
  ],
})
export class AdminModule {}
