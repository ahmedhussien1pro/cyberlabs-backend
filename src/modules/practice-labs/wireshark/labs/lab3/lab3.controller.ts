// src/modules/practice-labs/wireshark/labs/lab3/lab3.controller.ts
import { Controller, Post, Get, Body, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/wireshark/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  @Get('capture')
  async getCapture(@GetUser('id') userId: string, @Query('labId') labId: string) {
    return this.lab3Service.getCapture(userId, labId);
  }

  @Get('download')
  async downloadCapture(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Res() res: Response,
  ) {
    return this.lab3Service.streamPcap(userId, labId, res);
  }

  @Get('progress')
  async getProgress(@GetUser('id') userId: string, @Query('labId') labId: string) {
    return this.lab3Service.getProgress(userId, labId);
  }

  @Post('submit')
  async submitFlag(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('flag') flag: string,
  ) {
    return this.lab3Service.submitFlag(userId, labId, flag);
  }
}
