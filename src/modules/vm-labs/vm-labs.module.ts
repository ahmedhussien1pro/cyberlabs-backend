import { Module } from '@nestjs/common';
import { VmLabsController } from './vm-labs.controller';
import { VmLabsOrchestratorService } from './vm-labs-orchestrator.service';
import { VmLabsGateway } from './vm-labs.gateway';
import { DockerProvider } from './providers/docker.provider';
import { VmProviderFactory } from './providers/vm-provider.factory';
import { VmLabsHealthChecker } from './vm-labs.health-checker';

/**
 * VmLabsModule — self-contained feature module.
 *
 * Pre-requisites (add once to AppModule):
 *   - ScheduleModule.forRoot()   (for VmLabsHealthChecker @Cron jobs)
 *   - PrismaModule               (for PrismaService injection)
 */
@Module({
  controllers: [VmLabsController],
  providers: [
    // ── Cloud / Docker adapters ──
    DockerProvider,
    VmProviderFactory,
    // ── Orchestration ──
    VmLabsOrchestratorService,
    // ── WebSocket real-time gateway ──
    VmLabsGateway,
    // ── Periodic health checker (requires ScheduleModule) ──
    VmLabsHealthChecker,
  ],
  exports: [VmLabsOrchestratorService, VmLabsGateway, VmProviderFactory],
})
export class VmLabsModule {}
