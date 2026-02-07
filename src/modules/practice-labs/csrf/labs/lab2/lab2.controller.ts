import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/csrf/lab2')
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

  @Post('change-password')
  async changePassword(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('sessionId') sessionId: string,
    @Body('newPassword') newPassword: string,
    @Body('csrfToken') csrfToken?: string,
  ) {
    return this.lab2Service.changePassword(
      userId,
      labId,
      sessionId,
      newPassword,
      csrfToken,
    );
  }

  @Delete('account')
  async deleteAccount(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('sessionId') sessionId: string,
    @Query('csrfToken') csrfToken?: string,
  ) {
    return this.lab2Service.deleteAccount(userId, labId, sessionId, csrfToken);
  }

  @Post('sensitive-action')
  async sensitiveAction(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('sessionId') sessionId: string,
    @Body('csrfToken') csrfToken: string,
    @Body('action') action: string,
  ) {
    return this.lab2Service.sensitiveAction(
      userId,
      labId,
      sessionId,
      csrfToken,
      action,
    );
  }

  @Get('session')
  async getSession(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('sessionId') sessionId: string,
  ) {
    return this.lab2Service.getSession(userId, labId, sessionId);
  }
}
