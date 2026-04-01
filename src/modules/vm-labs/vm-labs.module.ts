import { Module } from '@nestjs/common';
import { VmLabsController } from './vm-labs.controller';
import { VmLabsOrchestratorService } from './vm-labs-orchestrator.service';
import { VmLabsGateway } from './vm-labs.gateway';
import { DockerProvider } from './providers/docker.provider';
import { VmProviderFactory } from './providers/vm-provider.factory';

@Module({
  controllers: [VmLabsController],
  providers: [
    // ── Providers (cloud adapters) ──
    DockerProvider,
    VmProviderFactory,
    // ── Core orchestration layer ──
    VmLabsOrchestratorService,
    // ── WebSocket gateway ──
    VmLabsGateway,
  ],
  exports: [VmLabsOrchestratorService, VmLabsGateway, VmProviderFactory],
})
export class VmLabsModule {}
