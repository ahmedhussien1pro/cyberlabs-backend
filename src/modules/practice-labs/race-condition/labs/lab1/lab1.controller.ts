import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/race-condition/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  @Get('balance')
  async getBalance(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('accountNo') accountNo: string,
  ) {
    return this.lab1Service.getBalance(userId, labId, accountNo);
  }

  @Post('transfer')
  async transfer(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('from') from: string,
    @Body('to') to: string,
    @Body('amount') amount: number,
  ) {
    return this.lab1Service.transfer(userId, labId, from, to, amount);
  }
}
