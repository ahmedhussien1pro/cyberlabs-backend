import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { UsersService } from '../services';
import { UpdateProfileDto, ChangePasswordDto, UserQueryDto } from '../dto';
import { JwtAuthGuard } from '../../../common/guards';
import { CurrentUser } from '../../../common/decorators';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { UserRole } from '../../../common';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get current user profile
   * GET /api/users/me
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMyProfile(@CurrentUser('id') userId: string) {
    const profile = await this.usersService.getUserProfile(userId);
    return {
      success: true,
      data: profile,
    };
  }

  /**
   * Update current user profile
   * PUT /api/users/me
   */
  @Put('me')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateData: UpdateProfileDto,
  ) {
    const updatedProfile = await this.usersService.updateProfile(
      userId,
      updateData,
    );
    return {
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile,
    };
  }

  /**
   * Change password
   * PUT /api/users/me/password
   */
  @Put('me/password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(userId, changePasswordDto);
    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  /**
   * Get current user statistics
   * GET /api/users/me/stats
   */
  @Get('me/stats')
  @HttpCode(HttpStatus.OK)
  async getMyStats(@CurrentUser('id') userId: string) {
    const stats = await this.usersService.getUserStats(userId);
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Get current user points
   * GET /api/users/me/points
   */
  @Get('me/points')
  @HttpCode(HttpStatus.OK)
  async getMyPoints(@CurrentUser('id') userId: string) {
    const points = await this.usersService.getUserPoints(userId);
    return {
      success: true,
      data: points,
    };
  }

  /**
   * Get current user's enrolled courses
   * GET /api/users/me/courses
   */
  @Get('me/courses')
  @HttpCode(HttpStatus.OK)
  async getMyCourses(@CurrentUser('id') userId: string) {
    const courses = await this.usersService.getUserEnrolledCourses(userId);
    return {
      success: true,
      data: courses,
    };
  }

  /**
   * Get current user's completed labs
   * GET /api/users/me/labs
   */
  @Get('me/labs')
  @HttpCode(HttpStatus.OK)
  async getMyLabs(@CurrentUser('id') userId: string) {
    const labs = await this.usersService.getUserCompletedLabs(userId);
    return {
      success: true,
      data: labs,
    };
  }

  /**
   * Get all users (Admin only)
   * GET /api/users
   */
  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getAllUsers(@Query() query: UserQueryDto) {
    const result = await this.usersService.getAllUsers(query);
    return {
      success: true,
      ...result,
    };
  }

  /**
   * Get user by ID (Public profile)
   * GET /api/users/:id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getUserById(@Param('id') userId: string) {
    const profile = await this.usersService.getUserProfile(userId);
    return {
      success: true,
      data: profile,
    };
  }

  /**
   * Get user statistics by ID
   * GET /api/users/:id/stats
   */
  @Get(':id/stats')
  @HttpCode(HttpStatus.OK)
  async getUserStats(@Param('id') userId: string) {
    const stats = await this.usersService.getUserStats(userId);
    return {
      success: true,
      data: stats,
    };
  }
}
