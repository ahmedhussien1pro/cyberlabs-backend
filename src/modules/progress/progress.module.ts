import { Module } from '@nestjs/common';
import { ProgressController } from './controllers';
import { ProgressService } from './services';
import { DatabaseModule } from '../../core/database';

@Module({
  imports: [DatabaseModule],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
