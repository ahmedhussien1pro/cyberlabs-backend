// src/modules/practice-labs/csrf/labs/lab2/lab2.controller.ts
import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/csrf/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  @Post('wallet/balance')
  getBalance(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.getBalance(userId, labId);
  }

  // ❌ الثغرة: يقبل form-encoded كبديل لـ JSON + بدون CSRF token
  @Post('transfer')
  transfer(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('toAccount') toAccount: string,
    @Body('amount') amount: number,
    @Headers('content-type') contentType?: string,
    @Headers('origin') origin?: string,
  ) {
    return this.lab2Service.transfer(
      userId,
      labId,
      toAccount,
      amount,
      contentType,
      origin,
    );
  }

  @Post('csrf/simulate-victim')
  simulateVictim(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('toAccount') toAccount: string,
    @Body('amount') amount: number,
  ) {
    return this.lab2Service.simulateVictim(userId, labId, toAccount, amount);
  }
}
