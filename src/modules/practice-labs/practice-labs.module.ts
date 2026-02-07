import { Module } from '@nestjs/common';
import { PracticeLabsController } from './practice-labs.controller';
import { PracticeLabsService } from './practice-labs.service';
import { DatabaseModule } from '../../core/database';
import { CommandInjectionModule } from './command-injection/command-injection.module';
import { AcVulnModule } from './ac-vuln/ac-vuln.module';
import { ApiHackingModule } from './api-hacking/api-hacking.module';
import { BrokenAuthModule } from './broken-auth/broken-auth.module';
import { BlVulnModule } from './business-logic/business-logic.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { IdorModule } from './idor/idor.module';
import { JwtModule } from '@nestjs/jwt';
import { SqlInjectionModule } from './sql-injection/sql-injection.module';
import { XssModule } from './xss/xss.module';
import { SstiModule } from './ssti/ssti.module';
import { RaceConditionModule } from './race-condition/race-condition.module';
import { CsrfModule } from './csrf/csrf.module';

@Module({
  imports: [
    DatabaseModule, // Import Prisma
    CsrfModule,
    CommandInjectionModule,
    AcVulnModule,
    RaceConditionModule,
    XssModule,
    SstiModule,
    SqlInjectionModule,
    JwtModule,
    IdorModule,
    FileUploadModule,
    BlVulnModule,
    BrokenAuthModule,
    ApiHackingModule,
  ],
  controllers: [PracticeLabsController],
  providers: [PracticeLabsService],
  exports: [PracticeLabsService],
})
export class PracticeLabsModule {}
