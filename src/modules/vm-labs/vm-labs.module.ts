import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VmLabsController } from './vm-labs.controller';
import { VmAdminController } from './vm-admin.controller';
import { VmLabsOrchestratorService } from './vm-labs-orchestrator.service';
import { VmLabsThrottler } from './vm-labs.throttler';

/**
 * VmLabsModule (Backend side)
 *
 * No Docker providers here — this module is a JWT-protected proxy layer.
 * All container orchestration happens in cyberlabs-vm-service (VPS).
 *
 * Wires:
 *   Controllers  → validate JWT + delegate to OrchestratorService
 *   Orchestrator → HttpService proxy to vm-service + local ownership check
 *   Throttler    → in-memory flag rate limiter (backend-side, first line of defence)
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 30_000,      // 30s — provisioning can take a moment
      maxRedirects: 0,
    }),
  ],
  controllers: [
    VmLabsController,
    VmAdminController,
  ],
  providers: [
    VmLabsOrchestratorService,
    VmLabsThrottler,
  ],
})
export class VmLabsModule {}
