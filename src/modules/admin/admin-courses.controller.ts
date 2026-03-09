// src/modules/admin/admin-courses.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
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
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';

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

  /**
   * PUT /admin/courses/:id/curriculum
   * Atomically replaces all sections / modules / lessons for a course.
   * Safe: validates body with UpdateCurriculumDto before touching the DB.
   */
  @Put(':id/curriculum')
  @HttpCode(HttpStatus.OK)
  updateCurriculum(
    @Param('id') id: string,
    @Body() dto: UpdateCurriculumDto,
  ) {
    return this.adminCoursesService.updateCurriculum(id, dto);
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
