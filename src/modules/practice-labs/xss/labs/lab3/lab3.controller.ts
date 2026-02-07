import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/xss/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  @Get('dashboard')
  async getDashboard(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('name') name?: string,
  ) {
    return this.lab3Service.getDashboard(userId, labId, name);
  }

  @Post('report-xss')
  async reportXSS(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('payload') payload: string,
  ) {
    return this.lab3Service.reportXSS(userId, labId, payload);
  }
}
