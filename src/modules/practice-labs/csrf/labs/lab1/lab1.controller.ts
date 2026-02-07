import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/csrf/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  @Post('login')
  async login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return this.lab1Service.login(userId, labId, username, password);
  }

  @Post('transfer')
  async transfer(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('sessionId') sessionId: string,
    @Body('toAccount') toAccount: string,
    @Body('amount') amount: number,
  ) {
    return this.lab1Service.transferMoney(
      userId,
      labId,
      sessionId,
      toAccount,
      amount,
    );
  }

  @Post('update-email')
  async updateEmail(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('sessionId') sessionId: string,
    @Body('newEmail') newEmail: string,
  ) {
    return this.lab1Service.updateEmail(userId, labId, sessionId, newEmail);
  }

  @Get('balance')
  async getBalance(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('sessionId') sessionId: string,
  ) {
    return this.lab1Service.getBalance(userId, labId, sessionId);
  }

  @Get('generate-attack')
  async generateAttack(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('targetUrl') targetUrl: string,
  ) {
    return this.lab1Service.generateAttackPage(userId, labId, targetUrl);
  }
}
