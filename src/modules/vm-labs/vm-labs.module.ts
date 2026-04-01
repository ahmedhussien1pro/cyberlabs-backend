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

/**
 * VmLabsModule — self-contained feature module.
 *
 * ⚠️  Pre-requisites in AppModule before registering this module:
 *   1. ScheduleModule.forRoot()   ← required for @Cron decorators
 *   2. PrismaModule               ← required for PrismaService injection
 *
 * Register in AppModule once Step 6 is complete:
 *   imports: [..., VmLabsModule]
 *
 * Plan status:
 *   ✅ [3.1] All module files created
 *   ✅ [4.1] All DTOs with class-validator
 *   ✅ [5.1] State machine enforced
 *   ✅ [5.2] VmPoolService: slot + queue
 *   ✅ [6.2] VmAdminController: separate admin controller
 *   ✅ [7.1] VmLabsGateway: WS + heartbeat
 *   ✅ [8.1] VmCleanupCron: all 6 jobs
 */
@Module({
  controllers: [
    VmLabsController,    // student endpoints
    VmAdminController,   // admin endpoints (separate controller)
  ],
  providers: [
    // ── Provider adapters (Docker / DO) ──
    DockerProvider,
    VmProviderFactory,
    // ── Core services ──
    VmPoolService,
    VmLabsOrchestratorService,
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
  ],
})
export class VmLabsModule {}
