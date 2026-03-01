import { Module } from '@nestjs/common';
import { PathsController } from './paths.controller';
import { PathsService } from './paths.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PathsController],
  providers: [PathsService],
  exports: [PathsService],
})
export class PathsModule {}
