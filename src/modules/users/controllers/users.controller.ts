// src/modules/users/controllers/users.controller.ts
import {
  Controller, Get, Put, Post, Delete, Body, Param, Query,
  UseGuards, HttpStatus, HttpCode, BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../services';
import {
  UpdateProfileDto, ChangePasswordDto, UserQueryDto,
  RequestAvatarUploadDto, UpdateNotificationPrefsDto,
  DeleteAccountDto, UpsertEducationDto,
} from '../dto';
import { JwtAuthGuard } from '../../../common/guards';
import { CurrentUser } from '../../../common/decorators';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { UserRole } from '../../../common';
import { Public } from '../../../common/decorators/public.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─────────────────────────────────────────────────────────────────────
  // PUBLIC — no auth required
  // ─────────────────────────────────────────────────────────────────────

  /** GET /api/v1/users/public/:id — full profile + stats, no auth */
  @Public()
  @Get('public/:id')
  @HttpCode(HttpStatus.OK)
  async getPublicProfile(@Param('id') userId: string) {
    return { success: true, data: await this.usersService.getPublicProfile(userId) };
  }

  // ─────────────────────────────────────────────────────────────────────
  // OWN PROFILE
  // ─────────────────────────────────────────────────────────────────────

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMyProfile(@CurrentUser('id') userId: string) {
    return { success: true, data: await this.usersService.getUserProfile(userId) };
  }

  @Put('me')
  @HttpCode(HttpStatus.OK)
  async updateProfile(@CurrentUser('id') userId: string, @Body() updateData: UpdateProfileDto) {
    return { success: true, message: 'Profile updated successfully', data: await this.usersService.updateProfile(userId, updateData) };
  }

  /** PUT /api/v1/users/me/education — full replace of education array */
  @Put('me/education')
  @HttpCode(HttpStatus.OK)
  async upsertEducation(@CurrentUser('id') userId: string, @Body() dto: UpsertEducationDto) {
    return { success: true, message: 'Education updated successfully', data: await this.usersService.upsertEducation(userId, dto) };
  }

  @Put('me/password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    await this.usersService.changePassword(userId, dto);
    return { success: true, message: 'Password changed successfully' };
  }

  @Get('me/stats')
  @HttpCode(HttpStatus.OK)
  async getMyStats(@CurrentUser('id') userId: string) {
    return { success: true, data: await this.usersService.getUserStats(userId) };
  }

  @Get('me/points')
  @HttpCode(HttpStatus.OK)
  async getMyPoints(@CurrentUser('id') userId: string) {
    return { success: true, data: await this.usersService.getUserPoints(userId) };
  }

  @Get('me/courses')
  @HttpCode(HttpStatus.OK)
  async getMyCourses(@CurrentUser('id') userId: string) {
    return { success: true, data: await this.usersService.getUserEnrolledCourses(userId) };
  }

  @Get('me/labs')
  @HttpCode(HttpStatus.OK)
  async getMyLabs(@CurrentUser('id') userId: string) {
    return { success: true, data: await this.usersService.getUserCompletedLabs(userId) };
  }

  @Get('me/activity')
  @HttpCode(HttpStatus.OK)
  async getMyActivity(@CurrentUser('id') userId: string) {
    return { success: true, data: await this.usersService.getUserActivity(userId) };
  }

  @Post('me/avatar/presign')
  @HttpCode(HttpStatus.OK)
  async requestAvatarUpload(@CurrentUser('id') userId: string, @Body() dto: RequestAvatarUploadDto) {
    return { success: true, data: await this.usersService.requestAvatarUpload(userId, dto.contentType) };
  }

  @Post('me/avatar/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmAvatarUpload(@CurrentUser('id') userId: string, @Body('key') key: string) {
    if (!key || typeof key !== 'string') throw new BadRequestException('key is required');
    return { success: true, data: { avatarUrl: await this.usersService.confirmAvatarUpload(userId, key) } };
  }

  @Get('me/sessions')
  @HttpCode(HttpStatus.OK)
  async getMySessions(@CurrentUser('id') userId: string) {
    return { success: true, data: await this.usersService.getUserSessions(userId) };
  }

  @Delete('me/sessions/:id')
  @HttpCode(HttpStatus.OK)
  async revokeSession(@CurrentUser('id') userId: string, @Param('id') sessionId: string) {
    await this.usersService.revokeSession(userId, sessionId);
    return { success: true, message: 'Session revoked' };
  }

  @Get('me/notifications/preferences')
  @HttpCode(HttpStatus.OK)
  async getNotificationPrefs(@CurrentUser('id') userId: string) {
    return { success: true, data: await this.usersService.getNotificationPreferences(userId) };
  }

  @Put('me/notifications/preferences')
  @HttpCode(HttpStatus.OK)
  async updateNotificationPrefs(@CurrentUser('id') userId: string, @Body() dto: UpdateNotificationPrefsDto) {
    return { success: true, data: await this.usersService.updateNotificationPreferences(userId, dto) };
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@CurrentUser('id') userId: string, @Body() dto: DeleteAccountDto) {
    await this.usersService.softDeleteAccount(userId, dto.reason);
    return { success: true, message: 'Account scheduled for deletion' };
  }

  @Get('me/export')
  @HttpCode(HttpStatus.OK)
  async exportMyData(@CurrentUser('id') userId: string) {
    return { success: true, data: await this.usersService.exportUserData(userId) };
  }

  // ─────────────────────────────────────────────────────────────────────
  // ADMIN
  // ─────────────────────────────────────────────────────────────────────

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getAllUsers(@Query() query: UserQueryDto) {
    return { success: true, ...(await this.usersService.getAllUsers(query)) };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getUserById(@Param('id') userId: string) {
    return { success: true, data: await this.usersService.getUserProfile(userId) };
  }

  @Get(':id/stats')
  @HttpCode(HttpStatus.OK)
  async getUserStats(@Param('id') userId: string) {
    return { success: true, data: await this.usersService.getUserStats(userId) };
  }

  @Get('username/:username')
  @HttpCode(HttpStatus.OK)
  async getUserByUsername(@Param('username') username: string) {
    return { success: true, data: await this.usersService.getUserByUsername(username) };
  }
}
