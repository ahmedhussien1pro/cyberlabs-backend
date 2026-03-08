import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminCoursesController } from './admin-courses.controller';
import { AdminCoursesService } from './admin-courses.service';

/**
 * AdminModule
 *
 * Central module for all platform administration features.
 * Each feature area is a dedicated controller + service pair sharing DatabaseModule.
 *
 * Controllers:
 *   AdminController        → GET  /admin/health
 *   AdminUsersController   → GET/PATCH /admin/users/*
 *   AdminCoursesController → GET/POST/PATCH/DELETE /admin/courses/*
 *
 * Future:
 *   AdminLabsController, AdminAnalyticsController, AdminSettingsController ...
 */
@Module({
  imports: [DatabaseModule],
  controllers: [
    AdminController,
    AdminUsersController,
    AdminCoursesController,
  ],
  providers: [
    AdminService,
    AdminUsersService,
    AdminCoursesService,
  ],
})
export class AdminModule {}
