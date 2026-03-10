// src/modules/admin/admin-badges.controller.ts
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
import { AdminBadgesService } from './admin-badges.service';
import { AdminGuard } from '../../common/guards';

@UseGuards(AdminGuard)
@Controller('admin/badges')
export class AdminBadgesController {
  constructor(private readonly adminBadgesService: AdminBadgesService) {}

  /** GET /admin/badges/stats */
  @Get('stats')
  getStats() {
    return this.adminBadgesService.getStats();
  }

  /** GET /admin/badges */
  @Get()
  findAll(@Query() query: any) {
    return this.adminBadgesService.findAll(query);
  }

  /** GET /admin/badges/:id */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminBadgesService.findOne(id);
  }

  /** POST /admin/badges */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: any) {
    return this.adminBadgesService.create(dto);
  }

  /** PATCH /admin/badges/:id */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.adminBadgesService.update(id, dto);
  }

  /** DELETE /admin/badges/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.adminBadgesService.remove(id);
  }
}
