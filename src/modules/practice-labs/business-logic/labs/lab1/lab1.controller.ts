import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/bl-vuln/lab1')
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
  ) {
    return this.lab1Service.getBalance(userId, labId);
  }

  @Post('purchase')
  async purchase(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('itemName') itemName: string,
    @Body('price') price: number,
    @Body('quantity') quantity: number,
  ) {
    return this.lab1Service.purchaseItem(
      userId,
      labId,
      itemName,
      price,
      quantity,
    );
  }

  @Post('refund')
  async refund(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('itemName') itemName: string,
    @Body('price') price: number,
    @Body('quantity') quantity: number,
  ) {
    return this.lab1Service.refundItem(
      userId,
      labId,
      itemName,
      price,
      quantity,
    );
  }
}
