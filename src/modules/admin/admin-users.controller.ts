import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { AdminGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';

/**
 * AdminUsersController
 *
 * Handles all admin-level user management operations.
 * Route namespace: /admin/users
 * Protection: AdminGuard (ADMIN role only, JWT already verified globally)
 *
 * Endpoint order matters:
 *   /admin/users/stats  must come BEFORE  /admin/users/:id
 *   to prevent NestJS from treating "stats" as an :id param.
 */
@UseGuards(AdminGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  /**
   * GET /admin/users/stats
   * Returns platform-wide user statistics:
   * total users, new this month, suspended count, breakdown by role.
   */
  @Get('stats')
  getStats() {
    return this.adminUsersService.getStats();
  }

  /**
   * GET /admin/users
   * Paginated user list with optional filters:
   * ?search=  ?role=  ?isActive=  ?page=  ?limit=
   */
  @Get()
  findAll(@Query() query: AdminUserQueryDto) {
    return this.adminUsersService.findAll(query);
  }

  /**
   * GET /admin/users/:id
   * Full user detail — includes security status, subscription, counts.
   * Passwords and secrets are never included.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminUsersService.findOne(id);
  }

  /**
   * PATCH /admin/users/:id/role
   * Change a user's role.
   * Business rules:
   *   - Admin cannot change their own role
   *   - Cannot demote the last remaining admin
   */
  @Patch(':id/role')
  updateRole(
    @CurrentUser() admin: any,
    @Param('id') targetId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminUsersService.updateRole(admin.id, targetId, dto);
  }

  /**
   * PATCH /admin/users/:id/suspend
   * Suspend a user: sets UserSecurity.isSuspended = true
   * and immediately revokes all active refresh tokens (force logout).
   * Business rules:
   *   - Admin cannot suspend themselves
   *   - Admin cannot suspend another admin
   */
  @Patch(':id/suspend')
  @HttpCode(HttpStatus.OK)
  suspend(
    @CurrentUser() admin: any,
    @Param('id') targetId: string,
    @Body() dto: SuspendUserDto,
  ) {
    return this.adminUsersService.suspend(admin.id, targetId, dto);
  }

  /**
   * PATCH /admin/users/:id/unsuspend
   * Lift a suspension: sets UserSecurity.isSuspended = false
   * and clears suspensionReason + suspendedAt.
   */
  @Patch(':id/unsuspend')
  @HttpCode(HttpStatus.OK)
  unsuspend(
    @CurrentUser() admin: any,
    @Param('id') targetId: string,
  ) {
    return this.adminUsersService.unsuspend(admin.id, targetId);
  }
}
