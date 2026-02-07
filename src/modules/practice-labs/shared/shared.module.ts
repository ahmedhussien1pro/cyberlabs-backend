import { Module } from '@nestjs/common';
import { PracticeLabStateService } from './services/practice-lab-state.service';
import { LabProgressService } from './services/lab-progress.service';
import { LabValidationService } from './services/lab-validation.service';

@Module({
  providers: [
    PracticeLabStateService,
    LabProgressService,
    LabValidationService,
  ],
  exports: [PracticeLabStateService, LabProgressService, LabValidationService],
})
export class SharedModule {}
