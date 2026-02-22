import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ProgressService } from '../services';
import { ProgressQueryDto } from '../dto';
import { JwtAuthGuard } from '../../../common/guards';
import { CurrentUser } from '../../../common/decorators';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  /**
   * Get overall progress
   * GET /api/progress/overview
   */
  @Get('overview')
  @HttpCode(HttpStatus.OK)
  async getOverallProgress(
    @CurrentUser('id') userId: string,
    @Query() query: ProgressQueryDto,
  ) {
    const progress = await this.progressService.getOverallProgress(
      userId,
      query,
    );
    return {
      success: true,
      data: progress,
    };
  }

  /**
   * Get courses progress
   * GET /api/progress/courses
   */
  @Get('courses')
  @HttpCode(HttpStatus.OK)
  async getCoursesProgress(@CurrentUser('id') userId: string) {
    const progress = await this.progressService.getCourseProgress(userId);
    return {
      success: true,
      data: progress,
    };
  }

  /**
   * Get labs progress
   * GET /api/progress/labs
   */
  @Get('labs')
  @HttpCode(HttpStatus.OK)
  async getLabsProgress(@CurrentUser('id') userId: string) {
    const progress = await this.progressService.getLabProgress(userId);
    return {
      success: true,
      data: progress,
    };
  }

  /**
   * Get progress by difficulty
   * GET /api/progress/by-difficulty
   */
  @Get('by-difficulty')
  @HttpCode(HttpStatus.OK)
  async getProgressByDifficulty(@CurrentUser('id') userId: string) {
    const stats = await this.progressService.getProgressByDifficulty(userId);
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Get learning streaks
   * GET /api/progress/streaks
   */
  @Get('streaks')
  @HttpCode(HttpStatus.OK)
  async getLearningStreaks(@CurrentUser('id') userId: string) {
    const streaks = await this.progressService.getLearningStreaks(userId);
    return {
      success: true,
      data: streaks,
    };
  }
  /**
   * Alias: GET /api/v1/progress  → overview
   * (frontend PROGRESS.BASE)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getProgressBase(
    @CurrentUser('id') userId: string,
    @Query() query: ProgressQueryDto,
  ) {
    return this.getOverallProgress(userId, query);
  }
  /**
   * Alias: GET /api/v1/progress/course/:courseId
   * (frontend PROGRESS.BY_COURSE)
   */
  @Get('course/:courseId')
  @HttpCode(HttpStatus.OK)
  async getProgressByCourse(
    @CurrentUser('id') userId: string,
    @Param('courseId') courseId: string,
  ) {
    const allProgress = await this.progressService.getCourseProgress(userId);
    const progress = allProgress.find((p) => p.courseId === courseId) ?? null;
    return { success: true, data: progress };
  }
  /**
   * Alias: GET /api/v1/progress/dashboard
   * (frontend PROGRESS.DASHBOARD)
   */
  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  async getProgressDashboard(@CurrentUser('id') userId: string) {
    return this.getOverallProgress(userId, {});
  }

  /**
   * Alias: GET /api/v1/progress/chart
   * (frontend PROGRESS.CHART_DATA)
   */
  @Get('chart')
  @HttpCode(HttpStatus.OK)
  async getProgressChart(@CurrentUser('id') userId: string) {
    const data = await this.progressService.getLabProgress(userId);
    return { success: true, data };
  }
}
