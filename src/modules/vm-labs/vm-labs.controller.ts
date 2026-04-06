/**
 * VmLabsController — Student-facing endpoints.
 *
 * Security:
 *   ✅ JwtAuthGuard on every route — userId extracted from verified JWT
 *   ✅ userId never taken from request body — always from req.user (server-side)
 *   ✅ Proxy calls include ownership assertion (orchestrator._assertOwnership)
 */
import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { VmLabsOrchestratorService } from './vm-labs-orchestrator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('vm-labs')
export class VmLabsController {
  constructor(private readonly orchestrator: VmLabsOrchestratorService) {}

  /** POST /vm-labs/start — start a new lab instance */
  @Post('start')
  startLab(
    @Body('templateId') templateId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.orchestrator.startLab(userId, templateId);
  }

  /** GET /vm-labs/instances — list my instances */
  @Get('instances')
  listInstances(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.orchestrator.listUserInstances(userId);
  }

  /** GET /vm-labs/instances/:id — get specific instance */
  @Get('instances/:id')
  getInstance(
    @Param('id') instanceId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.orchestrator.getInstance(userId, instanceId);
  }

  /** DELETE /vm-labs/instances/:id — stop instance */
  @Delete('instances/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  stopLab(
    @Param('id') instanceId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.orchestrator.stopLab(userId, instanceId);
  }

  /** PATCH /vm-labs/instances/:id/extend — extend session */
  @Patch('instances/:id/extend')
  extendSession(
    @Param('id') instanceId: string,
    @Body('minutes', ParseIntPipe) minutes: number,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.orchestrator.extendSession(userId, instanceId, minutes);
  }

  /** POST /vm-labs/instances/:id/flag — submit flag */
  @Post('instances/:id/flag')
  submitFlag(
    @Param('id') instanceId: string,
    @Body('flag') flag: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.orchestrator.submitFlag(userId, instanceId, flag);
  }

  /** POST /vm-labs/instances/:id/hints/:index — unlock hint */
  @Post('instances/:id/hints/:index')
  unlockHint(
    @Param('id') instanceId: string,
    @Param('index', ParseIntPipe) hintIndex: number,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.orchestrator.unlockHint(userId, instanceId, hintIndex);
  }
}
