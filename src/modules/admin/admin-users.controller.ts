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
import { UserActivityQueryDto } from './dto/user-activity-query.dto';

/**
 * AdminUsersController
 * Route namespace: /admin/users
 * Protection: AdminGuard (ADMIN role only)
 *
 * Endpoint order matters — static segments before :id
 */
@UseGuards(AdminGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  /** GET /admin/users/stats */
  @Get('stats')
  getStats() {
    return this.adminUsersService.getStats();
  }

  /** GET /admin/users */
  @Get()
  findAll(@Query() query: AdminUserQueryDto) {
    return this.adminUsersService.findAll(query);
  }

  /** GET /admin/users/:id */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminUsersService.findOne(id);
  }

  /** GET /admin/users/:id/activity */
  @Get(':id/activity')
  getActivity(
    @Param('id') id: string,
    @Query() query: UserActivityQueryDto,
  ) {
    return this.adminUsersService.getActivity(id, query);
  }

  /** PATCH /admin/users/:id/role */
  @Patch(':id/role')
  updateRole(
    @CurrentUser() admin: any,
    @Param('id') targetId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminUsersService.updateRole(admin.id, targetId, dto);
  }

  /** PATCH /admin/users/:id/suspend */
  @Patch(':id/suspend')
  @HttpCode(HttpStatus.OK)
  suspend(
    @CurrentUser() admin: any,
    @Param('id') targetId: string,
    @Body() dto: SuspendUserDto,
  ) {
    return this.adminUsersService.suspend(admin.id, targetId, dto);
  }

  /** PATCH /admin/users/:id/unsuspend */
  @Patch(':id/unsuspend')
  @HttpCode(HttpStatus.OK)
  unsuspend(
    @CurrentUser() admin: any,
    @Param('id') targetId: string,
  ) {
    return this.adminUsersService.unsuspend(admin.id, targetId);
  }
}
