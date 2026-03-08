import { Injectable } from '@nestjs/common';

/**
 * AdminService
 *
 * Base service for the admin module.
 * Acts as the entry point for shared admin logic.
 * Feature-specific services (AdminUsersService, AdminCoursesService, etc.)
 * will be separate services injected into their own controllers.
 */
@Injectable()
export class AdminService {
  /**
   * Returns a basic health status for the admin module.
   * Includes the authenticated admin's id and role for verification.
   */
  getHealth(user: any) {
    return {
      status: 'ok',
      module: 'admin',
      adminId: user?.id,
      adminRole: user?.role,
      timestamp: new Date().toISOString(),
    };
  }
}
