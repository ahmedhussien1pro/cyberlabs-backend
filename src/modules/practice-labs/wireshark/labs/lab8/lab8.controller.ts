// src/modules/practice-labs/wireshark/labs/lab8/lab8.controller.ts
import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab8Service } from './lab8.service';

@Controller('practice-labs/wireshark/lab8')
@UseGuards(JwtAuthGuard)
export class Lab8Controller {
  constructor(private lab8Service: Lab8Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab8Service.initLab(userId, labId);
  }

  @Get('capture')
  async getCapture(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
  ) {
    return this.lab8Service.getCapture(userId, labId);
  }

  @Get('progress')
  async getProgress(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
  ) {
    return this.lab8Service.getProgress(userId, labId);
  }

  @Post('submit')
  async submitFlag(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('flag') flag: string,
  ) {
    return this.lab8Service.submitFlag(userId, labId, flag);
  }
}
