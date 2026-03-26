// src/modules/practice-labs/cookies-lab/labs/lab4/lab4.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab4Service } from './lab4.service';

@Controller('practice-labs/cookies/lab4')
@UseGuards(JwtAuthGuard)
export class Lab4Controller {
  constructor(private lab4Service: Lab4Service) {}

  @Post('start')
  start(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab4Service.initLab(userId, labId);
  }

  // Simulates an admin page that sets a non-HttpOnly session cookie
  @Post('login')
  login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.lab4Service.login(userId, labId, email, password);
  }

  // ❌ Vuln: comment endpoint reflects input unsanitised (simulated XSS)
  @Post('comment')
  postComment(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('comment') comment: string,
  ) {
    return this.lab4Service.postComment(userId, labId, comment);
  }

  // Simulates the attacker server receiving the stolen cookie
  @Post('steal')
  stealCookie(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('stolenCookie') stolenCookie: string,
  ) {
    return this.lab4Service.validateStolenCookie(userId, labId, stolenCookie);
  }
}
