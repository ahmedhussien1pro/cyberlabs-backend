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
import { AdminLabsService } from './admin-labs.service';
import { AdminGuard } from '../../common/guards';
import { AdminLabQueryDto } from './dto/admin-lab-query.dto';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';

/**
 * AdminLabsController
 *
 * Full CRUD + publish/unpublish + duplicate for the admin panel.
 * Route namespace: /admin/labs
 * Protection: AdminGuard (ADMIN role only)
 */
@UseGuards(AdminGuard)
@Controller('admin/labs')
export class AdminLabsController {
  constructor(private readonly adminLabsService: AdminLabsService) {}

  /** GET /admin/labs/stats */
  @Get('stats')
  getStats() {
    return this.adminLabsService.getStats();
  }

  /** GET /admin/labs */
  @Get()
  findAll(@Query() query: AdminLabQueryDto) {
    return this.adminLabsService.findAll(query);
  }

  /** GET /admin/labs/:id */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminLabsService.findOne(id);
  }

  /** POST /admin/labs */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateLabDto) {
    return this.adminLabsService.create(dto);
  }

  /** POST /admin/labs/:id/duplicate */
  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  duplicate(@Param('id') id: string) {
    return this.adminLabsService.duplicate(id);
  }

  /** PATCH /admin/labs/:id */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLabDto) {
    return this.adminLabsService.update(id, dto);
  }

  /** PATCH /admin/labs/:id/publish */
  @Patch(':id/publish')
  @HttpCode(HttpStatus.OK)
  publish(@Param('id') id: string) {
    return this.adminLabsService.publish(id);
  }

  /** PATCH /admin/labs/:id/unpublish */
  @Patch(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  unpublish(@Param('id') id: string) {
    return this.adminLabsService.unpublish(id);
  }

  /** DELETE /admin/labs/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.adminLabsService.remove(id);
  }
}
