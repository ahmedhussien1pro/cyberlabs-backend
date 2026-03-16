// src/modules/practice-labs/linux/linux.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../core/database';
import { Lab1Controller } from './labs/lab1/lab1.controller';
import { Lab1Service } from './labs/lab1/lab1.service';
import { Lab2Controller } from './labs/lab2/lab2.controller';
import { Lab2Service } from './labs/lab2/lab2.service';
import { PracticeLabStateService } from '../shared/services/practice-lab-state.service';
import { HintPenaltyService } from '../shared/services/hint-penalty.service';
import { FlagRecordService } from '../shared/services/flag-record.service';

@Module({
  imports: [DatabaseModule],
  controllers: [Lab1Controller, Lab2Controller],
  providers: [Lab1Service, Lab2Service, PracticeLabStateService, HintPenaltyService, FlagRecordService],
})
export class LinuxModule {}
