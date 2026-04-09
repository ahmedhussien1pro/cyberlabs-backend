/**
 * VmLabsController — Student-facing endpoints.
 *
 * Endpoint contract matches cyberlabs-frontend-labs/src/features/lab-session/api/vmLabApi.ts
 *
 *   POST   /vm-labs/launch                        → start a new lab instance
 *   GET    /vm-labs/instances                      → list my active instances
 *   GET    /vm-labs/instance/:id                   → get specific instance status
 *   POST   /vm-labs/instance/:id/stop              → stop instance
 *   POST   /vm-labs/instance/:id/extend            → extend session +30 min
 *   POST   /vm-labs/instance/:id/submit            → submit flag
 *   POST   /vm-labs/instance/:id/hints/:index      → unlock hint
 *
 * Security:
 *   ✅ JwtAuthGuard on every route — userId extracted from verified JWT
 *   ✅ userId NEVER taken from request body — always from req.user (server-side)
 *   ✅ Proxy calls include ownership assertion (orchestrator._assertOwnership)
 */
import {
  Controller,
  Post,
  Get,
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

  /**
   * POST /vm-labs/launch
   * Body: { labId: string }   ← labId = templateId in vm-service
   * Frontend: apiLaunchVmLab(labId)
   */
  @Post('launch')
  launchLab(
    @Body('labId') labId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.orchestrator.startLab(userId, labId);
  }

  /**
   * GET /vm-labs/instances
   * Frontend: list of active instances (used as fallback/admin helper)
   */
  @Get('instances')
  listInstances(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.orchestrator.listUserInstances(userId);
  }

  /**
   * GET /vm-labs/instance/:id
   * Frontend: apiGetVmInstance(instanceId) — polled every 10s as WS fallback
   */
  @Get('instance/:id')
  getInstance(
    @Param('id') instanceId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.orchestrator.getInstance(userId, instanceId);
  }

  /**
   * POST /vm-labs/instance/:id/stop
   * Frontend: apiStopVmInstance(instanceId)
   * Note: Uses POST (not DELETE) to match frontend contract.
   */
  @Post('instance/:id/stop')
  @HttpCode(HttpStatus.OK)
  stopLab(
    @Param('id') instanceId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.orchestrator.stopLab(userId, instanceId);
  }

  /**
   * POST /vm-labs/instance/:id/extend
   * Frontend: apiExtendVmInstance(instanceId)
   * Returns: { expiresAt, extensionsUsed, secondsRemaining }
   */
  @Post('instance/:id/extend')
  extendSession(
    @Param('id') instanceId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.orchestrator.extendSession(userId, instanceId);
  }

  /**
   * POST /vm-labs/instance/:id/submit
   * Body: { flag: string }
   * Frontend: apiSubmitVmFlag(instanceId, flag)
   * Returns: VmFlagSubmitResult { correct, isFirstSolve, finalScore, message }
   */
  @Post('instance/:id/submit')
  submitFlag(
    @Param('id') instanceId: string,
    @Body('flag') flag: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.orchestrator.submitFlag(userId, instanceId, flag);
  }

  /**
   * POST /vm-labs/instance/:id/hints/:index
   * Frontend: unlock a hint at hintIndex
   */
  @Post('instance/:id/hints/:index')
  unlockHint(
    @Param('id') instanceId: string,
    @Param('index', ParseIntPipe) hintIndex: number,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.orchestrator.unlockHint(userId, instanceId, hintIndex);
  }
}
