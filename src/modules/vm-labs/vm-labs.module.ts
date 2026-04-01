import { Module } from '@nestjs/common';
import { VmLabsController } from './vm-labs.controller';
import { VmAdminController } from './vm-admin.controller';
import { VmLabsOrchestratorService } from './vm-labs-orchestrator.service';
import { VmPoolService } from './vm-pool.service';
import { VmLabsGateway } from './vm-labs.gateway';
import { VmCleanupCron } from './vm-cleanup.cron';
import { VmLabsHealthChecker } from './vm-labs.health-checker';
import { DockerProvider } from './providers/docker.provider';
import { VmProviderFactory } from './providers/vm-provider.factory';
import { VmLabsThrottler } from './vm-labs.throttler';
import { VmInstanceOwnerGuard } from './guards/vm-instance-owner.guard';
import { VmDailyCapGuard } from './guards/vm-daily-cap.guard';
import { VmVncTokenGuard } from './guards/vm-vnc-token.guard';

/**
 * VmLabsModule — self-contained feature module.
 *
 * ⚠️  Pre-requisites in AppModule:
 *   1. ScheduleModule.forRoot()  ← required for @Cron decorators
 *   2. PrismaModule              ← required for PrismaService injection
 *
 * Security controls registered (Step 9):
 *   ✅ [9.1] VmLabsThrottler     — flag rate limiter (10 attempts/60s)
 *   ✅ [9.5] VmInstanceOwnerGuard — ownership enforcement on instance routes
 *   ✅ [9.8] VmVncTokenGuard      — VNC access token validation + expiry
 *   ✅ [9.9] VmDailyCapGuard      — per-user daily start limits
 *
 * Plan status:
 *   ✅ [3.1] All module files created
 *   ✅ [4.1] All DTOs with class-validator
 *   ✅ [5.1] State machine enforced
 *   ✅ [5.2] VmPoolService: slot + queue
 *   ✅ [6.2] VmAdminController: separate admin controller
 *   ✅ [7.1] VmLabsGateway: WS + heartbeat
 *   ✅ [8.1] VmCleanupCron: all 6 jobs
 *   ✅ [9.1–9] Security hardening: throttler + ownership + VNC guards
 */
@Module({
  controllers: [
    VmLabsController,
    VmAdminController,
  ],
  providers: [
    // ── Provider adapters (Docker / DO) ──
    DockerProvider,
    VmProviderFactory,
    // ── Core services ──
    VmPoolService,
    VmLabsOrchestratorService,
    // ── Security: throttler + guards ──
    VmLabsThrottler,
    VmInstanceOwnerGuard,
    VmDailyCapGuard,
    VmVncTokenGuard,
    // ── WebSocket real-time gateway ──
    VmLabsGateway,
    // ── Scheduled jobs (requires ScheduleModule.forRoot()) ──
    VmCleanupCron,
    VmLabsHealthChecker,
  ],
  exports: [
    VmLabsOrchestratorService,
    VmPoolService,
    VmLabsGateway,
    VmProviderFactory,
    // Export guards so other modules can reuse them
    VmInstanceOwnerGuard,
    VmDailyCapGuard,
  ],
})
export class VmLabsModule {}
