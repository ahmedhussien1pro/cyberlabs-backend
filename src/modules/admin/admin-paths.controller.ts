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
import { AdminPathsService } from './admin-paths.service';
import { AdminGuard } from '../../common/guards';

/**
 * AdminPathsController
 * Route prefix: /admin/paths
 * Protected by AdminGuard (ADMIN + CONTENT_CREATOR roles)
 */
@UseGuards(AdminGuard)
@Controller('admin/paths')
export class AdminPathsController {
  constructor(private readonly adminPathsService: AdminPathsService) {}

  /** GET /admin/paths/stats */
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  getStats() {
    return this.adminPathsService.getStats();
  }

  /** GET /admin/paths?page=1&limit=20&search=...&isPublished=true */
  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: any) {
    return this.adminPathsService.findAll(query);
  }

  /** GET /admin/paths/:id */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.adminPathsService.findOne(id);
  }

  /** POST /admin/paths */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: any) {
    return this.adminPathsService.create(dto);
  }

  /** PATCH /admin/paths/:id */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() dto: any) {
    return this.adminPathsService.update(id, dto);
  }

  /** PATCH /admin/paths/:id/publish */
  @Patch(':id/publish')
  @HttpCode(HttpStatus.OK)
  publish(@Param('id') id: string) {
    return this.adminPathsService.publish(id);
  }

  /** PATCH /admin/paths/:id/unpublish */
  @Patch(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  unpublish(@Param('id') id: string) {
    return this.adminPathsService.unpublish(id);
  }

  /** DELETE /admin/paths/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.adminPathsService.remove(id);
  }
}
