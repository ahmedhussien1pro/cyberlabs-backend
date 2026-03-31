// src/modules/practice-labs/mcq/mcq.module.ts
import { Module }                  from '@nestjs/common';
import { MCQController }           from './mcq.controller';
import { MCQService }              from './mcq.service';
import { DatabaseModule }          from '../../../core/database';
import { SharedModule }            from '../shared/shared.module';

@Module({
  imports:     [DatabaseModule, SharedModule],
  controllers: [MCQController],
  providers:   [MCQService],
  exports:     [MCQService],
})
export class MCQModule {}
