// src/modules/practice-labs/ac-vuln/labs/lab5/lab5.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab5Service } from './lab5.service';

@Controller('practice-labs/ac-vuln/lab5')
@UseGuards(JwtAuthGuard)
export class Lab5Controller {
  constructor(private lab5Service: Lab5Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.initLab(userId, labId);
  }

  @Post('users/info')
  getUserInfo(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
  ) {
    return this.lab5Service.getUserInfo(userId, labId, username);
  }

  // ❌ VULN: accepts X-HTTP-Method-Override without re-checking admin role
  @Post('users/action')
  userAction(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
    @Headers('x-http-method-override') methodOverride?: string,
  ) {
    return this.lab5Service.userAction(userId, labId, username, methodOverride);
  }

  @Get('progress')
  progress(@GetUser('id') userId: string, @Query('labId') labId: string) {
    return this.lab5Service.getProgress(userId, labId);
  }

  @Post('submit')
  submit(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.submitFlag(userId, labId);
  }
}
