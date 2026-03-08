import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminCoursesService } from './admin-courses.service';
import { AdminGuard } from '../../common/guards';
import { AdminCourseQueryDto } from './dto/admin-course-query.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

/**
 * AdminCoursesController
 *
 * Full CRUD + publish/unpublish for the admin panel.
 * Route namespace: /admin/courses
 * Protection: AdminGuard (ADMIN role only)
 *
 * Endpoint order matters:
 *   /admin/courses/stats  must come BEFORE  /admin/courses/:id
 */
@UseGuards(AdminGuard)
@Controller('admin/courses')
export class AdminCoursesController {
  constructor(private readonly adminCoursesService: AdminCoursesService) {}

  /**
   * GET /admin/courses/stats
   * Total, published, unpublished, featured, byState breakdown.
   */
  @Get('stats')
  getStats() {
    return this.adminCoursesService.getStats();
  }

  /**
   * GET /admin/courses
   * All courses (no isPublished filter) with pagination and optional filters.
   * ?search= ?difficulty= ?category= ?access= ?state= ?isPublished= ?page= ?limit=
   */
  @Get()
  findAll(@Query() query: AdminCourseQueryDto) {
    return this.adminCoursesService.findAll(query);
  }

  /**
   * GET /admin/courses/:id
   * Full course detail including unpublished ones.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminCoursesService.findOne(id);
  }

  /**
   * POST /admin/courses
   * Create a new course. Always starts as unpublished (isPublished=false).
   * Use PATCH /admin/courses/:id/publish to make it live.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCourseDto) {
    return this.adminCoursesService.create(dto);
  }

  /**
   * PATCH /admin/courses/:id
   * Update course metadata fields.
   * Does NOT change publish state — use /publish or /unpublish for that.
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.adminCoursesService.update(id, dto);
  }

  /**
   * PATCH /admin/courses/:id/publish
   * Publishes the course: sets isPublished=true, state=PUBLISHED, publishedAt=now.
   * Returns 400 if already published.
   */
  @Patch(':id/publish')
  @HttpCode(HttpStatus.OK)
  publish(@Param('id') id: string) {
    return this.adminCoursesService.publish(id);
  }

  /**
   * PATCH /admin/courses/:id/unpublish
   * Hides the course: sets isPublished=false, state=DRAFT.
   * Returns 400 if already unpublished.
   */
  @Patch(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  unpublish(@Param('id') id: string) {
    return this.adminCoursesService.unpublish(id);
  }

  /**
   * DELETE /admin/courses/:id
   * Hard-deletes the course.
   * Returns 400 if any enrollments exist — unpublish first instead.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.adminCoursesService.remove(id);
  }
}
