import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('api/v1/practice-labs/api-hacking/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  @Post('login')
  async login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return this.lab3Service.login(userId, labId, username, password);
  }

  @Get('check-username')
  async checkUsername(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('username') username: string,
  ) {
    return this.lab3Service.checkUsername(userId, labId, username);
  }

  @Post('reset-rate-limit')
  async resetRateLimit(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
  ) {
    return this.lab3Service.resetRateLimit(userId, labId, username);
  }
}
