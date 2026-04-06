/**
 * VmAdminController — Admin-only endpoints.
 *
 * Security:
 *   ✅ JwtAuthGuard + AdminGuard on every route
 *   ✅ adminId extracted from JWT — never from client body
 */
import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VmLabsOrchestratorService } from './vm-labs-orchestrator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { Request } from 'express';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('vm-labs/admin')
export class VmAdminController {
  constructor(private readonly orchestrator: VmLabsOrchestratorService) {}

  /** GET /vm-labs/admin/instances */
  @Get('instances')
  listInstances(
    @Query('status') status?: string,
    @Query('templateId') templateId?: string,
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.orchestrator.adminListInstances(
      status as any,
      templateId,
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /** DELETE /vm-labs/admin/instances/:id — force-terminate */
  @Delete('instances/:id')
  terminateInstance(
    @Param('id') instanceId: string,
    @Req() req: Request,
  ) {
    const adminId = (req as any).user.id;
    return this.orchestrator.adminTerminate(adminId, instanceId);
  }

  /** GET /vm-labs/admin/templates */
  @Get('templates')
  listTemplates() {
    return this.orchestrator.adminListTemplates();
  }

  /** POST /vm-labs/admin/templates */
  @Post('templates')
  createTemplate(@Body() dto: any) {
    return this.orchestrator.adminCreateTemplate(dto);
  }

  /** PATCH /vm-labs/admin/templates/:id/toggle */
  @Patch('templates/:id/toggle')
  toggleTemplate(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.orchestrator.adminToggleTemplate(id, isActive);
  }
}
