import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

/**
 * AdminModule
 *
 * Central module for all platform administration features.
 * Each admin feature area is a dedicated controller + service pair.
 *
 * Current controllers:
 *   AdminController      → GET /admin/health
 *   AdminUsersController → GET/PATCH /admin/users/*
 *
 * Future controllers to be added here:
 *   AdminCoursesController, AdminLabsController,
 *   AdminAnalyticsController, AdminSettingsController, ...
 *
 * Route namespace: /admin
 * Access: ADMIN role only (AdminGuard on every controller)
 */
@Module({
  imports: [DatabaseModule],
  controllers: [AdminController, AdminUsersController],
  providers: [AdminService, AdminUsersService],
})
export class AdminModule {}
