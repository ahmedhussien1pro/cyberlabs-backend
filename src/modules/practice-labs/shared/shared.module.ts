import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../core/database';
import { PracticeLabStateService } from './services/practice-lab-state.service';
import { LabProgressService } from './services/lab-progress.service';
import { LabValidationService } from './services/lab-validation.service';
// ── PR #3 engines (were missing from DI — caused 500 on startup) ──────────────
import { FlagPolicyEngine } from './engines/flag-policy.engine';
import { XssDetectorEngine } from './engines/xss-detector.engine';
import { CsrfDetectorEngine } from './engines/csrf-detector.engine';

@Module({
  imports: [DatabaseModule],
  providers: [
    PracticeLabStateService,
    LabProgressService,
    LabValidationService,
    // Engines
    FlagPolicyEngine,
    XssDetectorEngine,
    CsrfDetectorEngine,
  ],
  exports: [
    PracticeLabStateService,
    LabProgressService,
    LabValidationService,
    // Engines
    FlagPolicyEngine,
    XssDetectorEngine,
    CsrfDetectorEngine,
  ],
})
export class SharedModule {}
