import { Module } from '@nestjs/common';
import { EnrollmentsController } from './controllers';
import { EnrollmentsService } from './services';
import { DatabaseModule } from '../../core/database';
import { NotificationsModule } from '../notifications/notifications.module';
@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
