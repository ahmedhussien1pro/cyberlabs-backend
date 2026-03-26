// src/modules/practice-labs/cookies-lab/labs/lab1/lab1.controller.ts
import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/cookies/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  @Post('start')
  start(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab1Service.initLab(userId, labId);
  }

  @Post('login')
  login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.lab1Service.login(userId, labId, email, password);
  }

  // ❌ Vuln: reads role from the x-session header (cookie value) without verification
  @Post('admin')
  adminPanel(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Headers('x-session') sessionCookie: string,
  ) {
    return this.lab1Service.adminPanel(userId, labId, sessionCookie);
  }
}
