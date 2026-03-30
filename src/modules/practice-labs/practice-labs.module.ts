// src/modules/practice-labs/practice-labs.module.ts
// ✅ PR #1 REFACTOR: Added 4 new focused service providers.
// All existing imports and lab sub-modules are preserved.

import { Module } from '@nestjs/common';
import { PracticeLabsController } from './practice-labs.controller';
import { PracticeLabsService } from './practice-labs.service';

// ── Shared services ──────────────────────────────────────────────────
import { PracticeLabStateService } from './shared/services/practice-lab-state.service';
import { HintPenaltyService } from './shared/services/hint-penalty.service';
import { FlagRecordService } from './shared/services/flag-record.service';

// ── New focused services (PR #1) ─────────────────────────────────────
import { LabCatalogService } from './services/lab-catalog.service';
import { LabLaunchService } from './services/lab-launch.service';
import { FlagSubmissionService } from './services/flag-submission.service';
import { HintDeliveryService } from './services/hint-delivery.service';

// ── Core ─────────────────────────────────────────────────────────────
import { DatabaseModule } from '../../core/database';

// ── Feature modules ──────────────────────────────────────────────────
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
import { CryptographyModule } from './cryptography/cryptography.module';
import { ObfuscationModule } from './obfuscation/obfuscation.module';
import { CookiesLabModule } from './cookies-lab/cookies-lab.module';
import { LinuxModule } from './linux/linux.module';
import { BashScriptingModule } from './bash-scripting/bash-scripting.module';
import { WiresharkModule } from './wireshark/wireshark.module';

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
    CryptographyModule,
    ObfuscationModule,
    CookiesLabModule,
    LinuxModule,
    BashScriptingModule,
    WiresharkModule,
  ],
  controllers: [PracticeLabsController],
  providers: [
    // Orchestrator
    PracticeLabsService,
    // Focused domain services (PR #1)
    LabCatalogService,
    LabLaunchService,
    FlagSubmissionService,
    HintDeliveryService,
    // Shared infrastructure services
    PracticeLabStateService,
    HintPenaltyService,
    FlagRecordService,
  ],
  exports: [
    PracticeLabsService,
    HintPenaltyService,
    FlagRecordService,
    // Export focused services for use by sub-modules if needed
    LabCatalogService,
    LabLaunchService,
    FlagSubmissionService,
    HintDeliveryService,
  ],
})
export class PracticeLabsModule {}
