import {
  Controller,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards';
import { CurrentUser } from '../../../common/decorators';
import { DashboardService } from '../services/dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getStats(@CurrentUser('id') userId: string) {
    return {
      success: true,
      data: await this.dashboardService.getStats(userId),
    };
  }

  @Get('activity')
  @HttpCode(HttpStatus.OK)
  async getActivity(@CurrentUser('id') userId: string) {
    return {
      success: true,
      data: await this.dashboardService.getRecentActivity(userId),
    };
  }

  @Get('courses')
  @HttpCode(HttpStatus.OK)
  async getCourses(@CurrentUser('id') userId: string) {
    return {
      success: true,
      data: await this.dashboardService.getEnrolledCourses(userId),
    };
  }

  @Get('labs/active')
  @HttpCode(HttpStatus.OK)
  async getActiveLabs(@CurrentUser('id') userId: string) {
    return {
      success: true,
      data: await this.dashboardService.getActiveLabs(userId),
    };
  }

  @Get('progress/weekly')
  @HttpCode(HttpStatus.OK)
  async getWeeklyProgress(@CurrentUser('id') userId: string) {
    return {
      success: true,
      data: await this.dashboardService.getWeeklyProgress(userId),
    };
  }

  @Get('progress/monthly')
  @HttpCode(HttpStatus.OK)
  async getMonthlyProgress(@CurrentUser('id') userId: string) {
    return {
      success: true,
      data: await this.dashboardService.getMonthlyProgress(userId),
    };
  }

  @Get('progress/chart')
  @HttpCode(HttpStatus.OK)
  async getProgressChart(@CurrentUser('id') userId: string) {
    return {
      success: true,
      data: await this.dashboardService.getProgressChart(userId),
    };
  }

  @Get('leaderboard')
  @HttpCode(HttpStatus.OK)
  async getLeaderboard(@CurrentUser('id') userId: string) {
    return {
      success: true,
      data: await this.dashboardService.getLeaderboard(userId),
    };
  }

  @Get('heatmap')
  @HttpCode(HttpStatus.OK)
  async getHeatmap(@CurrentUser('id') userId: string) {
    return {
      success: true,
      data: await this.dashboardService.getHeatmap(userId),
    };
  }
}
