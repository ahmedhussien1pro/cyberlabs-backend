import { Module } from '@nestjs/common';
import { VmLabsController } from './vm-labs.controller';
import { VmLabsOrchestratorService } from './vm-labs-orchestrator.service';
import { VmLabsGateway } from './vm-labs.gateway';

@Module({
  controllers: [VmLabsController],
  providers: [VmLabsOrchestratorService, VmLabsGateway],
  exports: [VmLabsOrchestratorService, VmLabsGateway],
})
export class VmLabsModule {}
