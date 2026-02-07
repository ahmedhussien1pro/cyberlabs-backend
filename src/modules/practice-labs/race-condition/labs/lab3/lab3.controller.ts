import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/race-condition/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  @Get('stock')
  async getStock(@Query('labId') labId: string) {
    return this.lab3Service.getStock(labId);
  }

  @Post('purchase')
  async purchase(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.purchaseItem(userId, labId);
  }
}
