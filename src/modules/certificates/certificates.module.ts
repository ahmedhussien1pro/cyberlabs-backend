import { Module } from '@nestjs/common';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';

@Module({
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService], // exported so CoursesService / EnrollmentsService can inject it
})
export class CertificatesModule {}
