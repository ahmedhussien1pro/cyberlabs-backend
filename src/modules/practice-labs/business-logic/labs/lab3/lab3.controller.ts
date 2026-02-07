import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/bl-vuln/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  @Post('verify-step')
  async verifyStep(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('step') step: string,
  ) {
    return this.lab3Service.verifyStep(userId, labId, step);
  }

  @Get('status')
  async getStatus(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
  ) {
    return this.lab3Service.getStatus(userId, labId);
  }

  @Post('access-premium')
  async accessPremium(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab3Service.accessPremiumFeature(userId, labId);
  }

  @Post('direct-premium')
  async directPremium(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('secretKey') secretKey?: string,
  ) {
    return this.lab3Service.directPremiumAccess(userId, labId, secretKey);
  }

  @Post('complete-all')
  async completeAll(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('steps') steps: string[],
  ) {
    return this.lab3Service.completeAllSteps(userId, labId, steps);
  }
}
