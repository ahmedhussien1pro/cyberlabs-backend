// src/modules/practice-labs/wireshark/labs/lab1/lab1.controller.ts
import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/wireshark/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  // endpoint اسمه 'capture' عشان يتطابق مع الفرونت
  // labId بييجي كـ query param مش body (GET مش بيبعت body)
  @Get('capture')
  async getCapture(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
  ) {
    return this.lab1Service.getCapture(userId, labId);
  }

  @Post('submit')
  async submitFlag(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('flag') flag: string,
  ) {
    return this.lab1Service.submitFlag(userId, labId, flag);
  }
}
