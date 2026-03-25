// src/modules/paths/paths.module.ts
import { Module } from '@nestjs/common';
import { PathsController } from './paths.controller';
import { PathsService } from './paths.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { CertificatesModule } from '../certificates/certificates.module';

@Module({
  imports: [NotificationsModule, CertificatesModule],
  controllers: [PathsController],
  providers: [PathsService],
  exports: [PathsService],
})
export class PathsModule {}
