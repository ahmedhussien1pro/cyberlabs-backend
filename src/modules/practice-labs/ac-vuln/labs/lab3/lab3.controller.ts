import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
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

  @Get('balance')
  async getBalance(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('accountNo') accountNo: string,
  ) {
    return this.lab3Service.getAccountBalance(userId, labId, accountNo);
  }

  @Post('update-balance')
  async updateBalance(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('accountNo') accountNo: string,
    @Body('balance') balance: number,
  ) {
    return this.lab3Service.updateAccountBalance(
      userId,
      labId,
      accountNo,
      balance,
    );
  }

  @Post('create-account')
  async createAccount(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body() accountData: any,
  ) {
    return this.lab3Service.createAccount(userId, labId, accountData);
  }
}
