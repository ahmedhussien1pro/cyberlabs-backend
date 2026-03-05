// src/modules/practice-labs/broken-auth/labs/lab2/lab2.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/broken-auth/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  @Post('auth/login')
  login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.lab2Service.login(userId, labId, email, password);
  }

  // يعيد الـ remember-me token الخاص بك
  @Post('auth/get-remember-token')
  getRememberToken(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab2Service.getRememberToken(userId, labId);
  }

  // يساعد في فهم الخوارزمية
  @Post('auth/forge-token')
  forgeToken(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('email') email: string,
    @Body('role') role: string,
  ) {
    return this.lab2Service.forgeToken(userId, labId, email, role);
  }

  // ❌ الثغرة: يقبل remember-me token بدون DB validation
  @Post('auth/remember-login')
  rememberLogin(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('rememberToken') rememberToken: string,
  ) {
    return this.lab2Service.rememberLogin(userId, labId, rememberToken);
  }
}
