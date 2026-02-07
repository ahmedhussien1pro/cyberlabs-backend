import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/broken-auth/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  @Post('login')
  async login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
    @Body('password') password: string,
    @Body('sessionId') sessionId?: string,
  ) {
    return this.lab2Service.login(userId, labId, username, password, sessionId);
  }

  @Get('session')
  async getSession(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('sessionId') sessionId: string,
  ) {
    return this.lab2Service.getSession(userId, labId, sessionId);
  }

  @Get('protected-data')
  async accessProtectedData(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('sessionId') sessionId: string,
  ) {
    return this.lab2Service.accessProtectedData(userId, labId, sessionId);
  }

  @Get('sessions')
  async listSessions(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
  ) {
    return this.lab2Service.listSessions(userId, labId);
  }

  @Post('logout')
  async logout(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('sessionId') sessionId: string,
  ) {
    return this.lab2Service.logout(userId, labId, sessionId);
  }
}
