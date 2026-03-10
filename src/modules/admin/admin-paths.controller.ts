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

  // ── Lab relations ──────────────────────────────────────────────────────────

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
}
