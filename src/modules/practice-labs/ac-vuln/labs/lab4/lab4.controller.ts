// src/modules/practice-labs/ac-vuln/labs/lab4/lab4.controller.ts
import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab4Service } from './lab4.service';

@Controller('practice-labs/ac-vuln/lab4')
@UseGuards(JwtAuthGuard)
export class Lab4Controller {
  constructor(private lab4Service: Lab4Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.initLab(userId, labId);
  }

  @Post('documents/mine')
  getMyDocuments(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.getMyDocuments(userId, labId);
  }

  @Post('documents/all')
  getAllDocuments(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.getAllDocuments(userId, labId);
  }

  @Post('documents/download')
  downloadDocument(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('docId') docId: string,
  ) {
    return this.lab4Service.downloadDocument(userId, labId, docId);
  }

  @Get('progress')
  progress(@GetUser('id') userId: string, @Query('labId') labId: string) {
    return this.lab4Service.getProgress(userId, labId);
  }

  @Post('submit')
  submit(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.submitFlag(userId, labId);
  }
}
