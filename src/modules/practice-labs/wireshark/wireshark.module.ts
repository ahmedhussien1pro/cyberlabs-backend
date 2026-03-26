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
import { PracticeLabStateService } from '../shared/services/practice-lab-state.service';
import { HintPenaltyService }      from '../shared/services/hint-penalty.service';
import { FlagRecordService }        from '../shared/services/flag-record.service';

@Module({
  imports:     [DatabaseModule],
  controllers: [Lab1Controller, Lab2Controller, Lab3Controller, Lab4Controller, Lab5Controller],
  providers:   [Lab1Service, Lab2Service, Lab3Service, Lab4Service, Lab5Service,
                PracticeLabStateService, HintPenaltyService, FlagRecordService],
})
export class WiresharkModule {}
