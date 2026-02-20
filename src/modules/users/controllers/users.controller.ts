// src/modules/users/controllers/users.controller.ts
import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../services';
import {
  UpdateProfileDto,
  ChangePasswordDto,
  UserQueryDto,
  RequestAvatarUploadDto,
} from '../dto';
import { JwtAuthGuard } from '../../../common/guards';
import { CurrentUser } from '../../../common/decorators';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { UserRole } from '../../../common';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMyProfile(@CurrentUser('id') userId: string) {
    return {
      success: true,
      data: await this.usersService.getUserProfile(userId),
    };
  }

  @Put('me')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateData: UpdateProfileDto,
  ) {
    return {
      success: true,
      message: 'Profile updated successfully',
      data: await this.usersService.updateProfile(userId, updateData),
    };
  }

  @Put('me/password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(userId, dto);
    return { success: true, message: 'Password changed successfully' };
  }

  @Get('me/stats')
  @HttpCode(HttpStatus.OK)
  async getMyStats(@CurrentUser('id') userId: string) {
    return {
      success: true,
      data: await this.usersService.getUserStats(userId),
    };
  }

  @Get('me/points')
  @HttpCode(HttpStatus.OK)
  async getMyPoints(@CurrentUser('id') userId: string) {
    return {
      success: true,
      data: await this.usersService.getUserPoints(userId),
    };
  }

  @Get('me/courses')
  @HttpCode(HttpStatus.OK)
  async getMyCourses(@CurrentUser('id') userId: string) {
    return {
      success: true,
      data: await this.usersService.getUserEnrolledCourses(userId),
    };
  }

  @Get('me/labs')
  @HttpCode(HttpStatus.OK)
  async getMyLabs(@CurrentUser('id') userId: string) {
    return {
      success: true,
      data: await this.usersService.getUserCompletedLabs(userId),
    };
  }

  /** GET /api/v1/users/me/activity */
  @Get('me/activity')
  @HttpCode(HttpStatus.OK)
  async getMyActivity(@CurrentUser('id') userId: string) {
    return {
      success: true,
      data: await this.usersService.getUserActivity(userId),
    };
  }

  /** POST /api/v1/users/me/avatar/presign */
  @Post('me/avatar/presign')
  @HttpCode(HttpStatus.OK)
  async requestAvatarUpload(
    @CurrentUser('id') userId: string,
    @Body() dto: RequestAvatarUploadDto,
  ) {
    return {
      success: true,
      data: await this.usersService.requestAvatarUpload(
        userId,
        dto.contentType,
      ),
    };
  }

  /** POST /api/v1/users/me/avatar/confirm */
  @Post('me/avatar/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmAvatarUpload(
    @CurrentUser('id') userId: string,
    @Body('key') key: string,
  ) {
    if (!key || typeof key !== 'string') {
      throw new BadRequestException('key is required');
    }
    return {
      success: true,
      data: {
        avatarUrl: await this.usersService.confirmAvatarUpload(userId, key),
      },
    };
  }

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
    return {
      success: true,
      data: await this.usersService.getUserProfile(userId),
    };
  }

  @Get(':id/stats')
  @HttpCode(HttpStatus.OK)
  async getUserStats(@Param('id') userId: string) {
    return {
      success: true,
      data: await this.usersService.getUserStats(userId),
    };
  }
}
