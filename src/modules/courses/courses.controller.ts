// src/modules/courses/courses.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  Body,
  Post,
  Put,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CourseFiltersDto } from './dto/course-filters.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubscriptionGuard } from '../../common/guards';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async list(
    @Query() filters: CourseFiltersDto,
    @CurrentUser() user: any | null,
  ) {
    const userId = user?.id ?? null;
    return this.coursesService.listCourses(userId, filters);
  }

  @Get('me/progress')
  @UseGuards(JwtAuthGuard)
  async myProgress(@CurrentUser() user: any) {
    return this.coursesService.getMyProgress(user.id);
  }

  @Get(':slug')
  async get(@Param('slug') slug: string) {
    return this.coursesService.getBySlug(slug);
  }

  @Get(':slug/topics')
  async getTopics(@Param('slug') slug: string) {
    return this.coursesService.getTopics(slug);
  }

  @Get(':slug/topics/:topicId')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  async getTopic(
    @Param('slug') slug: string,
    @Param('topicId') topicId: string,
  ) {
    return this.coursesService.getTopic(slug, topicId);
  }

  // ✅ NEW: Get rich content from JSON file
  @Get(':slug/content')
  async getContent(@Param('slug') slug: string) {
    return this.coursesService.getCourseContent(slug);
  }
  @Get(':slug/labs')
  async getCourseLabs(@Param('slug') slug: string) {
    return this.coursesService.getCourseLabs(slug);
  }
  // ✅ FIXED: Support both courseId and slug
  @Post(':courseIdOrSlug/enroll')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async enroll(
    @Param('courseIdOrSlug') courseIdOrSlug: string,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.enroll(user.id, courseIdOrSlug);
  }

  @Post(':courseId/topics/:topicId/complete')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async complete(
    @Param('courseId') courseId: string,
    @Param('topicId') topicId: string,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.markComplete(user.id, courseId, topicId);
  }

  @Put('me/favorites')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async syncFavorite(
    @Body('courseId') courseId: string,
    @Body('action') action: 'add' | 'remove',
    @CurrentUser() user: any,
  ) {
    return this.coursesService.syncFavorite(user.id, courseId, action);
  }
}
