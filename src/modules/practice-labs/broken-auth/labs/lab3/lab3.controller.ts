import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/broken-auth/lab3')
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

  @Post('verify-token')
  async verifyToken(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('token') token: string,
  ) {
    return this.lab3Service.verifyToken(userId, labId, token);
  }

  @Post('admin-panel')
  async accessAdminPanel(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('token') token: string,
  ) {
    return this.lab3Service.accessAdminPanel(userId, labId, token);
  }

  @Post('verify-unsafe')
  async verifyTokenUnsafe(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('token') token: string,
  ) {
    return this.lab3Service.verifyTokenUnsafe(userId, labId, token);
  }

  @Get('hint')
  async getHint(@GetUser('id') userId: string, @Query('labId') labId: string) {
    return this.lab3Service.getHint(userId, labId);
  }
}
