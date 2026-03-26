// src/modules/practice-labs/wireshark/wireshark.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../core/database';
import { Lab1Controller } from './labs/lab1/lab1.controller';
import { Lab1Service }    from './labs/lab1/lab1.service';
import { Lab2Controller } from './labs/lab2/lab2.controller';
import { Lab2Service }    from './labs/lab2/lab2.service';
import { Lab3Controller } from './labs/lab3/lab3.controller';
import { Lab3Service }    from './labs/lab3/lab3.service';
import { Lab4Controller } from './labs/lab4/lab4.controller';
import { Lab4Service }    from './labs/lab4/lab4.service';
import { Lab5Controller } from './labs/lab5/lab5.controller';
import { Lab5Service }    from './labs/lab5/lab5.service';
import { Lab6Controller } from './labs/lab6/lab6.controller';
import { Lab6Service }    from './labs/lab6/lab6.service';
import { Lab7Controller } from './labs/lab7/lab7.controller';
import { Lab7Service }    from './labs/lab7/lab7.service';
import { Lab8Controller } from './labs/lab8/lab8.controller';
import { Lab8Service }    from './labs/lab8/lab8.service';
import { PracticeLabStateService } from '../shared/services/practice-lab-state.service';
import { HintPenaltyService }      from '../shared/services/hint-penalty.service';
import { FlagRecordService }        from '../shared/services/flag-record.service';

@Module({
  imports:     [DatabaseModule],
  controllers: [
    Lab1Controller, Lab2Controller, Lab3Controller,
    Lab4Controller, Lab5Controller, Lab6Controller,
    Lab7Controller, Lab8Controller,
  ],
  providers: [
    Lab1Service, Lab2Service, Lab3Service,
    Lab4Service, Lab5Service, Lab6Service,
    Lab7Service, Lab8Service,
    PracticeLabStateService, HintPenaltyService, FlagRecordService,
  ],
})
export class WiresharkModule {}
