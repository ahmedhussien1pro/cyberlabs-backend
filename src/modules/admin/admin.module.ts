import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

/**
 * AdminModule
 *
 * Central module for all platform administration features.
 * All admin sub-modules (users, courses, labs, analytics, etc.) will be
 * imported here as feature sub-modules in subsequent implementation steps.
 *
 * Route namespace: /admin
 * Access: ADMIN role only (enforced by AdminGuard on every controller)
 */
@Module({
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
