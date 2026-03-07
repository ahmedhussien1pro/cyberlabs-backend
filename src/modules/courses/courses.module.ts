import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { BadgesModule } from '../badges/badges.module';
import { CertificatesModule } from '../certificates/certificates.module';

@Module({
  imports: [BadgesModule, CertificatesModule],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
