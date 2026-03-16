// src/modules/practice-labs/wireshark/wireshark.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../core/database';
import { SharedModule } from '../shared/shared.module';
import { Lab1Controller } from './labs/lab1/lab1.controller';
import { Lab1Service } from './labs/lab1/lab1.service';
import { Lab2Controller } from './labs/lab2/lab2.controller';
import { Lab2Service } from './labs/lab2/lab2.service';

@Module({
  imports: [DatabaseModule, SharedModule],
  controllers: [Lab1Controller, Lab2Controller],
  providers: [Lab1Service, Lab2Service],
})
export class WiresharkModule {}
