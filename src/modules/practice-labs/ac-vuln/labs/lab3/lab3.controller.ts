// src/modules/practice-labs/ac-vuln/labs/lab3/lab3.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/ac-vuln/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  // ❌ الثغرة: accountNo يأتي من request body بدون التحقق من ownership
  @Post('account/balance')
  async getBalance(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('accountNo') accountNo: string,
  ) {
    return this.lab3Service.getBalance(userId, labId, accountNo);
  }

  // ❌ نفس الثغرة في endpoint التحويلات
  @Post('account/transactions')
  async getTransactions(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('accountNo') accountNo: string,
  ) {
    return this.lab3Service.getTransactions(userId, labId, accountNo);
  }
}
