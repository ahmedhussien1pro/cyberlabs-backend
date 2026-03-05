// src/modules/practice-labs/bl-vuln/labs/lab4/lab4.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab4Service } from './lab4.service';

@Controller('practice-labs/bl-vuln/lab4')
@UseGuards(JwtAuthGuard)
export class Lab4Controller {
  constructor(private lab4Service: Lab4Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.initLab(userId, labId);
  }

  @Post('wallet/balance')
  getBalance(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.getBalance(userId, labId);
  }

  // ❌ الثغرة: لا يوجد locking — race condition
  @Post('wallet/transfer')
  transfer(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('toAccount') toAccount: string,
    @Body('amount') amount: number,
  ) {
    return this.lab4Service.transfer(userId, labId, toAccount, amount);
  }
}
