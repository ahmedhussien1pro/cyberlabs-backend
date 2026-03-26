// src/modules/practice-labs/cookies-lab/labs/lab2/lab2.controller.ts
import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/cookies/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  @Post('start')
  start(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab2Service.initLab(userId, labId);
  }

  @Post('login')
  login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.lab2Service.login(userId, labId, email, password);
  }

  // ❌ Vuln: trusts Base64-encoded userId from x-session header without signature check
  @Post('admin')
  adminPanel(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Headers('x-session') sessionCookie: string,
  ) {
    return this.lab2Service.adminPanel(userId, labId, sessionCookie);
  }
}
