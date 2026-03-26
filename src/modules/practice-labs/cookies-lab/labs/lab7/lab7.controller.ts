// src/modules/practice-labs/cookies-lab/labs/lab7/lab7.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab7Service } from './lab7.service';

@Controller('practice-labs/cookies/lab7')
@UseGuards(JwtAuthGuard)
export class Lab7Controller {
  constructor(private lab7Service: Lab7Service) {}

  @Post('start')
  start(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab7Service.initLab(userId, labId);
  }

  // Returns a weak (predictable) session ID pattern
  @Post('login')
  login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.lab7Service.login(userId, labId, email, password);
  }

  // Observe a set of generated sessions to find the pattern
  @Post('observe')
  observe(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab7Service.observeSessions(userId, labId);
  }

  // Attacker guesses/predicts the admin session ID and submits it
  @Post('predict')
  predict(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('predictedSessionId') predictedSessionId: string,
  ) {
    return this.lab7Service.predictAdminSession(userId, labId, predictedSessionId);
  }
}
