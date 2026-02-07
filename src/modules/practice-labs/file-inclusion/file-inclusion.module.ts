import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../core/database';
import { SharedModule } from '../shared/shared.module';

import { Lab1Controller } from './labs/lab1/lab1.controller';
import { Lab1Service } from './labs/lab1/lab1.service';
import { Lab3Controller } from './labs/lab3/lab3.controller';
import { Lab3Service } from './labs/lab3/lab3.service';

@Module({
  imports: [DatabaseModule, SharedModule],
  controllers: [Lab1Controller, Lab3Controller],
  providers: [Lab1Service, Lab3Service],
  exports: [Lab1Service, Lab3Service],
})
export class FileInclusionModule {}
