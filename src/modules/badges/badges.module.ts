import { Module } from '@nestjs/common';
import { BadgesController } from './badges.controller';
import { BadgesService } from './badges.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule], // ✅ required: BadgesService injects NotificationsService
  controllers: [BadgesController],
  providers: [BadgesService],
  exports: [BadgesService], // exported so PracticeLabsService / CoursesService can inject it
})
export class BadgesModule {}
