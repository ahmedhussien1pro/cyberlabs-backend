// src/modules/practice-labs/ac-vuln/labs/lab3/lab3.controller.ts
import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/ac-vuln/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  @Post('account/balance')
  getBalance(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('accountNo') accountNo: string,
  ) {
    return this.lab3Service.getBalance(userId, labId, accountNo);
  }

  @Post('account/transactions')
  getTransactions(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('accountNo') accountNo: string,
  ) {
    return this.lab3Service.getTransactions(userId, labId, accountNo);
  }

  @Get('progress')
  progress(@GetUser('id') userId: string, @Query('labId') labId: string) {
    return this.lab3Service.getProgress(userId, labId);
  }

  @Post('submit')
  submit(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.submitFlag(userId, labId);
  }
}
