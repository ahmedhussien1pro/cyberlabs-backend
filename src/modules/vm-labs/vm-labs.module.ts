import { Module } from '@nestjs/common';
import { VmLabsController } from './vm-labs.controller';
import { VmAdminController } from './vm-admin.controller';
import { VmLabsOrchestratorService } from './vm-labs-orchestrator.service';
import { VmLabsThrottler } from './vm-labs.throttler';

/**
 * VmLabsModule (Backend side)
 *
 * No Docker providers here — this module is a JWT-protected proxy layer.
 * All container orchestration happens in cyberlabs-vm-service.
 *
 * Uses native axios (already in dependencies) instead of @nestjs/axios
 * to avoid adding an extra dependency.
 *
 * Wires:
 *   Controllers  → validate JWT + delegate to OrchestratorService
 *   Orchestrator → axios proxy to vm-service + local ownership check
 *   Throttler    → in-memory flag rate limiter (backend-side)
 */
@Module({
  imports: [],
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
