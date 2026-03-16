import { Module } from '@nestjs/common';
import { PracticeLabsController } from './practice-labs.controller';
import { PracticeLabsService } from './practice-labs.service';
import { PracticeLabStateService } from './shared/services/practice-lab-state.service';
import { HintPenaltyService } from './shared/services/hint-penalty.service';
import { FlagRecordService } from './shared/services/flag-record.service';
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
import { BadgesModule } from '../badges/badges.module';
import { NotificationsModule } from '../notifications/notifications.module';
// ── New lab modules ────────────────────────────────────────────────
import { CryptographyModule } from './cryptography/cryptography.module';
import { ObfuscationModule } from './obfuscation/obfuscation.module';
import { CookiesLabModule } from './cookies-lab/cookies-lab.module';
import { LinuxModule } from './linux/linux.module';
import { BashScriptingModule } from './bash-scripting/bash-scripting.module';
import { WiresharkModule } from './wireshark/wireshark.module';
import { JwtLabModule } from './jwt/jwt.module';
import { CaptchaBypassModule } from './captcha-bypass/captcha-bypass.module';

@Module({
  imports: [
    DatabaseModule,
    BadgesModule,
    NotificationsModule,
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
    // ── New ──────────────────────────────────────────────────────────
    CryptographyModule,
    ObfuscationModule,
    CookiesLabModule,
    LinuxModule,
    BashScriptingModule,
    WiresharkModule,
    JwtLabModule,
    CaptchaBypassModule,
  ],
  controllers: [PracticeLabsController],
  providers: [
    PracticeLabsService,
    PracticeLabStateService,
    HintPenaltyService,
    FlagRecordService,
  ],
  exports: [PracticeLabsService, HintPenaltyService, FlagRecordService],
})
export class PracticeLabsModule {}
