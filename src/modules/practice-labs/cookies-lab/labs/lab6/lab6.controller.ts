// src/modules/practice-labs/cookies-lab/labs/lab6/lab6.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab6Service } from './lab6.service';

@Controller('practice-labs/cookies/lab6')
@UseGuards(JwtAuthGuard)
export class Lab6Controller {
  constructor(private lab6Service: Lab6Service) {}

  @Post('start')
  start(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab6Service.initLab(userId, labId);
  }

  // Returns session cookie details including missing flags
  @Post('login')
  login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.lab6Service.login(userId, labId, email, password);
  }

  // Audit endpoint: student submits which flags are missing
  @Post('audit')
  audit(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('missingFlags') missingFlags: string[],
  ) {
    return this.lab6Service.auditCookieFlags(userId, labId, missingFlags);
  }

  // Fix endpoint: student submits correct cookie configuration
  @Post('fix')
  fix(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('secure') secure: boolean,
    @Body('httpOnly') httpOnly: boolean,
    @Body('sameSite') sameSite: string,
  ) {
    return this.lab6Service.applyCookieFix(userId, labId, secure, httpOnly, sameSite);
  }
}
