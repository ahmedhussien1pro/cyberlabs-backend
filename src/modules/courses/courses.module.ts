// src/modules/courses/courses.module.ts
import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { PrismaService } from '../../core/database';
import { ProgressModule } from '../progress/progress.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ProgressModule, NotificationsModule],
  controllers: [CoursesController],
  providers: [CoursesService, PrismaService],
  exports: [CoursesService],
})
export class CoursesModule {}
