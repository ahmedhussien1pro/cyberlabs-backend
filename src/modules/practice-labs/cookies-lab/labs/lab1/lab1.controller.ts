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
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  // تسجيل الدخول بالـ credentials الضعيفة
  @Post('login')
  async login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.lab1Service.login(userId, labId, email, password);
  }

  // ❌ الثغرة: يقرأ role من cookie header
  @Post('admin')
  async adminPanel(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Headers('x-session') sessionCookie: string,
  ) {
    return this.lab1Service.adminPanel(userId, labId, sessionCookie);
  }
}
