// src/modules/practice-labs/cookies-lab/labs/lab3/lab3.controller.ts
import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/cookies/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  @Post('start')
  start(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab3Service.initLab(userId, labId);
  }

  // ❌ Vuln Step 1: accepts attacker-planted sessionId before authentication
  @Post('pre-auth')
  preAuth(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('sessionId') sessionId: string,
  ) {
    return this.lab3Service.preAuth(userId, labId, sessionId);
  }

  // ❌ Vuln Step 2: authenticates but does NOT regenerate session
  @Post('login')
  login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('sessionId') sessionId: string,
  ) {
    return this.lab3Service.login(userId, labId, email, password, sessionId);
  }

  // ❌ Vuln Step 3: trusts x-session header as valid authenticated session
  @Post('admin')
  adminPanel(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Headers('x-session') sessionId: string,
  ) {
    return this.lab3Service.adminPanel(userId, labId, sessionId);
  }
}
