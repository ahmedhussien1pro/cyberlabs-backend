// src/modules/practice-labs/broken-auth/labs/lab1/lab1.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/broken-auth/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  @Post('auth/leaked-passwords')
  getLeakedPasswords(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab1Service.getLeakedPasswords(userId, labId);
  }

  // ❌ الثغرة: بدون rate limiting أو account lockout
  @Post('auth/login')
  login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.lab1Service.login(userId, labId, email, password);
  }

  // محاكاة brute-force تلقائي
  @Post('auth/brute-force-simulate')
  bruteForce(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('targetEmail') targetEmail: string,
  ) {
    return this.lab1Service.bruteForceSimulate(userId, labId, targetEmail);
  }
}
