// src/modules/practice-labs/cookies-lab/labs/lab5/lab5.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab5Service } from './lab5.service';

@Controller('practice-labs/cookies/lab5')
@UseGuards(JwtAuthGuard)
export class Lab5Controller {
  constructor(private lab5Service: Lab5Service) {}

  @Post('start')
  start(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab5Service.initLab(userId, labId);
  }

  // ❌ Vuln: server accepts a client-provided session ID and uses it as-is
  @Post('login')
  login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('presetSession') presetSession: string, // attacker-controlled
  ) {
    return this.lab5Service.login(userId, labId, email, password, presetSession);
  }

  // Access a protected resource using the session ID
  @Post('dashboard')
  dashboard(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('sessionId') sessionId: string,
  ) {
    return this.lab5Service.accessDashboard(userId, labId, sessionId);
  }
}
