import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { Lab1Service } from './labs/lab1/lab1.service';
import { Lab1Controller } from './labs/lab1/lab1.controller';
import { Lab2Service } from './labs/lab2/lab2.service';
import { Lab2Controller } from './labs/lab2/lab2.controller';
import { Lab3Service } from './labs/lab3/lab3.service';
import { Lab3Controller } from './labs/lab3/lab3.controller';

@Module({
  imports: [SharedModule],
  controllers: [Lab1Controller, Lab2Controller, Lab3Controller],
  providers: [Lab1Service, Lab2Service, Lab3Service],
})
export class JwtModule {}
