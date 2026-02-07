import { Module } from '@nestjs/common';
import { LabsController, SubmissionsController,LabInstanceController } from './controllers';
import { LabsService, SubmissionsService,LabInstanceService  } from './services';
import { DatabaseModule } from '../../core/database';

@Module({
  imports: [DatabaseModule],
  controllers: [LabsController, SubmissionsController, LabInstanceController],
  providers: [LabsService, SubmissionsService, LabInstanceService ],
  exports: [LabsService, SubmissionsService, LabInstanceService ],
})
export class LabsModule {}
