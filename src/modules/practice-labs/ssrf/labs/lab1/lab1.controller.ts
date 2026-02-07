import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/ssrf/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  @Post('fetch-url')
  async fetchUrl(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('url') url: string,
  ) {
    return this.lab1Service.fetchUrl(userId, labId, url);
  }

  @Post('check-stock')
  async checkStock(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('productUrl') productUrl: string,
  ) {
    return this.lab1Service.checkStockAvailability(userId, labId, productUrl);
  }

  @Post('state')
  async getState(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.getState(userId, labId);
  }
}
