import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../core/database';
import { PracticeLabStateService } from './services/practice-lab-state.service';
import { LabProgressService } from './services/lab-progress.service';
import { LabValidationService } from './services/lab-validation.service';
import { FlagRecordService } from './services/flag-record.service';
import { HintPenaltyService } from './services/hint-penalty.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    PracticeLabStateService,
    LabProgressService,
    LabValidationService,
    FlagRecordService,
    HintPenaltyService,
  ],
  exports: [
    PracticeLabStateService,
    LabProgressService,
    LabValidationService,
    FlagRecordService,
    HintPenaltyService,
  ],
})
export class SharedModule {}
