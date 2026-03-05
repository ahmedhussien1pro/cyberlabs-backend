// src/modules/practice-labs/ac-vuln/labs/lab1/lab1.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/ac-vuln/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  // ❌ الثغرة: patientId يأتي من المستخدم بدون التحقق من ownership
  @Post('records')
  async getRecord(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('patientId') patientId: string,
  ) {
    return this.lab1Service.getRecord(userId, labId, patientId);
  }
}
