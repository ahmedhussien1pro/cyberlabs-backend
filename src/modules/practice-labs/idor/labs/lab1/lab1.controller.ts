import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/idor/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  // بدء اللاب
  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  // عرض جميع الحسابات
  @Get('accounts')
  async getAccounts(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab1Service.getAllAccounts(userId, labId);
  }

  // قراءة تفاصيل حساب محدد (IDOR endpoint)
  @Get('accounts/:accountNumber')
  async getAccountDetails(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Param('accountNumber') accountNumber: string,
  ) {
    return this.lab1Service.getAccountDetails(userId, labId, accountNumber);
  }

  // تحويل الأموال (IDOR endpoint)
  @Post('transfer')
  async transfer(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('from') from: string,
    @Body('to') to: string,
    @Body('amount') amount: number,
  ) {
    return this.lab1Service.transferMoney(userId, labId, from, to, amount);
  }
}
