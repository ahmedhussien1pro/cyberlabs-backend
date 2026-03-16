// src/modules/practice-labs/cookies-lab/cookies-lab.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../core/database';
import { PracticeLabSharedModule } from '../shared/practice-lab-shared.module';
import { Lab1Controller } from './labs/lab1/lab1.controller';
import { Lab1Service } from './labs/lab1/lab1.service';
import { Lab2Controller } from './labs/lab2/lab2.controller';
import { Lab2Service } from './labs/lab2/lab2.service';

@Module({
  imports: [PrismaModule, PracticeLabSharedModule],
  controllers: [Lab1Controller, Lab2Controller],
  providers: [Lab1Service, Lab2Service],
})
export class CookiesLabModule {}
