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

@Controller('courses') // Base path is typically prefixed globally with /api/v1 in NestJS main.ts
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

  @Post(':courseId/enroll')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async enroll(@Param('courseId') courseId: string, @CurrentUser() user: any) {
    return this.coursesService.enroll(user.id, courseId);
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
