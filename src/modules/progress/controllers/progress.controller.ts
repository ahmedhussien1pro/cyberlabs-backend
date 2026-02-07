import {
  Controller,
  Get,
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
}
