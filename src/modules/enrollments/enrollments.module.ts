import { Module } from '@nestjs/common';
import { EnrollmentsController } from './controllers';
import { EnrollmentsService } from './services';
import { DatabaseModule } from '../../core/database';

@Module({
  imports: [DatabaseModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
