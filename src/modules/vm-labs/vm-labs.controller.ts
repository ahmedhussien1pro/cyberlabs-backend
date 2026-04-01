import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import { Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums/common.enums';
import { VmLabsOrchestratorService } from './vm-labs-orchestrator.service';
import { StartVmLabDto } from './dto/start-vm-lab.dto';
import { SubmitFlagDto } from './dto/submit-flag.dto';
import { ExtendSessionDto } from './dto/extend-session.dto';
import { UnlockHintDto } from './dto/unlock-hint.dto';
import { AdminVmQueryDto } from './dto/admin-query.dto';

@ApiTags('VM Labs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vm-labs')
export class VmLabsController {
  constructor(private readonly orchestrator: VmLabsOrchestratorService) {}

  // ── Student endpoints ───────────────────────────────────────────────────────

  @Post('start')
  @ApiOperation({ summary: 'Start a new VM lab instance' })
  @HttpCode(HttpStatus.CREATED)
  startLab(@CurrentUser() user: any, @Body() dto: StartVmLabDto) {
    return this.orchestrator.startLab(user.id, dto.labTemplateId);
  }

  @Delete('instances/:instanceId/stop')
  @ApiOperation({ summary: 'Stop a running VM lab instance' })
  @HttpCode(HttpStatus.NO_CONTENT)
  stopLab(@CurrentUser() user: any, @Param('instanceId') instanceId: string) {
    return this.orchestrator.stopLab(user.id, instanceId);
  }

  @Get('instances')
  @ApiOperation({ summary: 'List current user lab instances' })
  listInstances(@CurrentUser() user: any) {
    return this.orchestrator.listUserInstances(user.id);
  }

  @Get('instances/:instanceId')
  @ApiOperation({ summary: 'Get single instance details' })
  getInstance(@CurrentUser() user: any, @Param('instanceId') instanceId: string) {
    return this.orchestrator.getInstance(user.id, instanceId);
  }

  @Patch('instances/:instanceId/extend')
  @ApiOperation({ summary: 'Extend session time' })
  extendSession(
    @CurrentUser() user: any,
    @Param('instanceId') instanceId: string,
    @Body() dto: ExtendSessionDto,
  ) {
    return this.orchestrator.extendSession(user.id, instanceId, dto.minutes);
  }

  @Post('instances/:instanceId/flag')
  @ApiOperation({ summary: 'Submit a flag' })
  submitFlag(
    @CurrentUser() user: any,
    @Param('instanceId') instanceId: string,
    @Body() dto: SubmitFlagDto,
  ) {
    return this.orchestrator.submitFlag(user.id, instanceId, dto.flag);
  }

  @Post('instances/:instanceId/hints')
  @ApiOperation({ summary: 'Unlock a hint (with score penalty)' })
  unlockHint(
    @CurrentUser() user: any,
    @Param('instanceId') instanceId: string,
    @Body() dto: UnlockHintDto,
  ) {
    return this.orchestrator.unlockHint(user.id, instanceId, dto.hintIndex);
  }

  // ── Admin endpoints ───────────────────────────────────────────────────────

  @Get('admin/instances')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] List all instances' })
  adminListInstances(@Query() query: AdminVmQueryDto) {
    // fix TS2345: coerce optional numbers explicitly to avoid `number | undefined` mismatch
    return this.orchestrator.adminListInstances(
      query.status,
      query.templateId,
      query.userId,
      query.page   !== undefined ? Number(query.page)  : 1,
      query.limit  !== undefined ? Number(query.limit) : 20,
    );
  }

  @Delete('admin/instances/:instanceId/terminate')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Force terminate instance' })
  adminTerminate(@CurrentUser() user: any, @Param('instanceId') instanceId: string) {
    return this.orchestrator.adminTerminate(user.id, instanceId);
  }

  @Get('admin/templates')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] List all lab templates' })
  adminListTemplates() {
    return this.orchestrator.adminListTemplates();
  }

  @Post('admin/templates')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[Admin] Create lab template' })
  adminCreateTemplate(@Body() dto: any) {
    return this.orchestrator.adminCreateTemplate(dto);
  }

  @Patch('admin/templates/:id/toggle')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Toggle template active state' })
  adminToggleTemplate(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.orchestrator.adminToggleTemplate(id, isActive);
  }
}
