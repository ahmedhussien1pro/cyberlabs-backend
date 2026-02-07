import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/ac-vuln/lab2')
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
  ) {
    return this.lab2Service.login(userId, labId, username, password);
  }

  @Post('update-profile')
  async updateProfile(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
    @Body('email') email?: string,
    @Body('role') role?: string,
  ) {
    return this.lab2Service.updateProfile(userId, labId, username, email, role);
  }

  @Get('admin-panel')
  async accessAdminPanel(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('username') username: string,
  ) {
    return this.lab2Service.accessAdminPanel(userId, labId, username);
  }
}
