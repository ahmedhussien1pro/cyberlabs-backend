// src/modules/practice-labs/wireshark/labs/lab2/lab2.controller.ts
import { Controller, Post, Get, Body, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/wireshark/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  @Get('capture')
  async getCapture(@GetUser('id') userId: string, @Query('labId') labId: string) {
    return this.lab2Service.getCapture(userId, labId);
  }

  @Get('download')
  async downloadCapture(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Res() res: Response,
  ) {
    return this.lab2Service.streamPcap(userId, labId, res);
  }

  @Get('progress')
  async getProgress(@GetUser('id') userId: string, @Query('labId') labId: string) {
    return this.lab2Service.getProgress(userId, labId);
  }

  @Post('submit')
  async submitFlag(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('flag') flag: string,
  ) {
    return this.lab2Service.submitFlag(userId, labId, flag);
  }
}
