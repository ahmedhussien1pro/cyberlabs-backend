import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * AdminController
 *
 * Base controller for the /admin namespace.
 * All routes here are protected by AdminGuard (ADMIN role required).
 * JwtAuthGuard is already applied globally via APP_GUARD in AppModule.
 *
 * This controller currently exposes only a health-check endpoint.
 * Additional admin sub-controllers (users, courses, labs, etc.) will be
 * added as separate controllers inside this module in future steps.
 */
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /admin/health
   * Verifies the admin module is running and the caller is an ADMIN.
   * Useful for frontend auth-check on login.
   */
  @Get('health')
  health(@CurrentUser() user: any) {
    return this.adminService.getHealth(user);
  }
}
