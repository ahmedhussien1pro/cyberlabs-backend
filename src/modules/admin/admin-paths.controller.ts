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

  /** POST /admin/paths/sync-all-stats
   *  One-time repair: recalculates totalCourses, totalLabs, estimatedHours
   *  for every path in the DB based on actual attached modules.
   */
  @Post('sync-all-stats')
  @HttpCode(HttpStatus.OK)
  syncAllStats() {
    return this.adminPathsService.syncAllPathsStats();
  }

  /** GET /admin/paths */
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

  /** POST /admin/paths/:id/duplicate */
  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  duplicate(@Param('id') id: string) {
    return this.adminPathsService.duplicate(id);
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

  // ── Lab relations ─────────────────────────────────────────────────────────

  /** GET /admin/paths/:id/labs */
  @Get(':id/labs')
  @HttpCode(HttpStatus.OK)
  getLabs(@Param('id') id: string) {
    return this.adminPathsService.getLabs(id);
  }

  /** POST /admin/paths/:id/labs/:labId */
  @Post(':id/labs/:labId')
  @HttpCode(HttpStatus.OK)
  attachLab(
    @Param('id') id: string,
    @Param('labId') labId: string,
    @Body() dto: any,
  ) {
    return this.adminPathsService.attachLab(id, labId, dto);
  }

  /** DELETE /admin/paths/:id/labs/:labId */
  @Delete(':id/labs/:labId')
  @HttpCode(HttpStatus.OK)
  detachLab(
    @Param('id') pathId: string,
    @Param('labId') labId: string,
  ) {
    return this.adminPathsService.detachLab(pathId, labId);
  }

  // ── Course relations ───────────────────────────────────────────────────────

  /** POST /admin/paths/:id/courses/:courseId */
  @Post(':id/courses/:courseId')
  @HttpCode(HttpStatus.OK)
  attachCourse(
    @Param('id') pathId: string,
    @Param('courseId') courseId: string,
    @Body() dto: any,
  ) {
    return this.adminPathsService.attachCourse(pathId, courseId, dto);
  }

  /** DELETE /admin/paths/:id/courses/:courseId */
  @Delete(':id/courses/:courseId')
  @HttpCode(HttpStatus.OK)
  detachCourse(
    @Param('id') pathId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.adminPathsService.detachCourse(pathId, courseId);
  }

  // ── Reorder ────────────────────────────────────────────────────────────────

  /** PATCH /admin/paths/:id/modules/reorder */
  @Patch(':id/modules/reorder')
  @HttpCode(HttpStatus.OK)
  reorderModules(
    @Param('id') pathId: string,
    @Body() dto: { orders: { id: string; order: number }[] },
  ) {
    return this.adminPathsService.reorderModules(pathId, dto.orders);
  }
}
