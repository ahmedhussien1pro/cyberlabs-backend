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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards';
import { RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { CurrentUser } from '../../common/decorators';
import { UserRole } from '../../common/enums/common.enums';
import { VmLabsOrchestratorService } from './vm-labs-orchestrator.service';
import { VmPoolService } from './vm-pool.service';
import { AdminListInstancesDTO } from './dto/admin-list-instances.dto'; // fix: was AdminListInstancesDto

@ApiTags('Admin — VM Labs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/vm-labs')
export class VmAdminController {
  constructor(
    private readonly orchestrator: VmLabsOrchestratorService,
    private readonly poolService: VmPoolService,
  ) {}

  // ── Instances ────────────────────────────────────────────────────

  @Get('instances')
  @ApiOperation({ summary: '[Admin] List all instances (filterable)' })
  @ApiResponse({ status: 200, description: 'Paginated list of all VM instances' })
  listInstances(@Query() query: AdminListInstancesDTO) {
    return this.orchestrator.adminListInstances(
      query.status,
      query.templateId,
      query.userId,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Delete('instances/:instanceId/terminate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Force-terminate any instance' })
  @ApiResponse({ status: 200, description: 'Instance terminated' })
  terminate(
    @CurrentUser() admin: any,
    @Param('instanceId') instanceId: string,
  ) {
    return this.orchestrator.adminTerminate(admin.id, instanceId);
  }

  // ── Templates ────────────────────────────────────────────────────

  @Get('templates')
  @ApiOperation({ summary: '[Admin] List all lab templates' })
  listTemplates() {
    return this.orchestrator.adminListTemplates();
  }

  @Post('templates')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[Admin] Create a new VM lab template' })
  createTemplate(@Body() dto: any) {
    return this.orchestrator.adminCreateTemplate(dto);
  }

  @Patch('templates/:id/toggle')
  @ApiOperation({ summary: '[Admin] Toggle template active state' })
  toggleTemplate(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.orchestrator.adminToggleTemplate(id, isActive);
  }

  // ── Pool ────────────────────────────────────────────────────────────

  @Get('pool')
  @ApiOperation({ summary: '[Admin] Get pool capacity stats per template' })
  getPoolStats() {
    return this.poolService.getPoolStats();
  }

  @Post('pool/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Manually sync pool counts from DB' })
  syncPool() {
    return this.poolService.syncAllPoolCounts();
  }
}
