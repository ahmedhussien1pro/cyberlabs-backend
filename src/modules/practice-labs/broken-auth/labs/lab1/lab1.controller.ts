import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/broken-auth/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  @Post('login')
  async login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return this.lab1Service.login(userId, labId, username, password);
  }

  @Post('register')
  async register(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
    @Body('password') password: string,
    @Body('email') email: string,
  ) {
    return this.lab1Service.register(userId, labId, username, password, email);
  }

  @Post('reset-password')
  async resetPassword(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
    @Body('email') email: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.lab1Service.resetPassword(
      userId,
      labId,
      username,
      email,
      newPassword,
    );
  }

  @Get('hint')
  async getHint(@GetUser('id') userId: string, @Query('labId') labId: string) {
    return this.lab1Service.getHint(userId, labId);
  }
}
