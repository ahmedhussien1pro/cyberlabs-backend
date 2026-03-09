// src/modules/admin/admin-courses.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminCoursesService } from './admin-courses.service';
import { AdminGuard } from '../../common/guards';
import { AdminCourseQueryDto } from './dto/admin-course-query.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ImportCourseDto } from './dto/import-course.dto';

@UseGuards(AdminGuard)
@Controller('admin/courses')
export class AdminCoursesController {
  constructor(private readonly adminCoursesService: AdminCoursesService) {}

  /** GET /admin/courses/stats */
  @Get('stats')
  getStats() {
    return this.adminCoursesService.getStats();
  }

  /** GET /admin/courses */
  @Get()
  findAll(@Query() query: AdminCourseQueryDto) {
    return this.adminCoursesService.findAll(query);
  }

  // ─── CourseLab Management ────────────────────────────────────────────────
  // IMPORTANT: These sub-routes must come BEFORE :id to avoid NestJS treating
  // "reorder" or "labs" as a course ID.

  /** GET /admin/courses/:id/labs */
  @Get(':id/labs')
  getCourseLabs(@Param('id') id: string) {
    return this.adminCoursesService.getCourseLabs(id);
  }

  /**
   * PATCH /admin/courses/:id/labs/reorder
   * Must be BEFORE :id/labs/:labId so NestJS doesn't treat "reorder" as labId.
   * Body: { labIds: string[] }
   */
  @Patch(':id/labs/reorder')
  @HttpCode(HttpStatus.OK)
  reorderLabs(
    @Param('id') courseId: string,
    @Body() body: { labIds: string[] },
  ) {
    if (!Array.isArray(body?.labIds)) {
      throw new BadRequestException('labIds must be an array');
    }
    return this.adminCoursesService.reorderLabs(courseId, body.labIds);
  }

  /** POST /admin/courses/:id/labs/:labId — attach lab to course */
  @Post(':id/labs/:labId')
  @HttpCode(HttpStatus.CREATED)
  attachLab(
    @Param('id') courseId: string,
    @Param('labId') labId: string,
  ) {
    return this.adminCoursesService.attachLab(courseId, labId);
  }

  /** DELETE /admin/courses/:id/labs/:labId — detach lab from course */
  @Delete(':id/labs/:labId')
  @HttpCode(HttpStatus.OK)
  detachLab(
    @Param('id') courseId: string,
    @Param('labId') labId: string,
  ) {
    return this.adminCoursesService.detachLab(courseId, labId);
  }

  // ─── Course CRUD ─────────────────────────────────────────────────────────

  /** GET /admin/courses/:id */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminCoursesService.findOne(id);
  }

  /** POST /admin/courses */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCourseDto) {
    return this.adminCoursesService.create(dto);
  }

  /** POST /admin/courses/import-json */
  @Post('import-json')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (!file.originalname.endsWith('.json')) {
          return cb(
            new BadRequestException('Only .json files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async importJson(
    @UploadedFile() file: Express.Multer.File,
    @Body('metadata') metadataRaw: string,
  ) {
    if (!file) {
      throw new BadRequestException('JSON course file is required');
    }
    if (!metadataRaw) {
      throw new BadRequestException('metadata field is required');
    }

    let metadata: ImportCourseDto;
    try {
      metadata = JSON.parse(metadataRaw) as ImportCourseDto;
    } catch {
      throw new BadRequestException('metadata must be a valid JSON string');
    }

    return this.adminCoursesService.importJson(file.buffer, metadata);
  }

  /** PATCH /admin/courses/:id */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.adminCoursesService.update(id, dto);
  }

  /** PATCH /admin/courses/:id/publish */
  @Patch(':id/publish')
  @HttpCode(HttpStatus.OK)
  publish(@Param('id') id: string) {
    return this.adminCoursesService.publish(id);
  }

  /** PATCH /admin/courses/:id/unpublish */
  @Patch(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  unpublish(@Param('id') id: string) {
    return this.adminCoursesService.unpublish(id);
  }

  /** DELETE /admin/courses/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.adminCoursesService.remove(id);
  }
}
