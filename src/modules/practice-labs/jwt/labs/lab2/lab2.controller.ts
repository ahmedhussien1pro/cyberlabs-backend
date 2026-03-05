// src/modules/practice-labs/jwt/labs/lab2/lab2.controller.ts
import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/jwt/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  // يصدر JWT token مع weak secret
  @Post('auth/login')
  async login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
  ) {
    return this.lab2Service.login(userId, labId, username);
  }

  // endpoint لمحاكاة brute-force (للمساعدة في التعلم)
  @Post('jwt/crack')
  async crackJWT(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('token') token: string,
  ) {
    return this.lab2Service.crackJWT(userId, labId, token);
  }

  // للمستخدمين العاديين: يعرض الدورات المجانية
  @Post('courses/free')
  async getFreeCourses(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab2Service.getFreeCourses(userId, labId);
  }

  // ✅ Protected: يتطلب admin token
  @Post('courses/premium')
  async getPremiumCourses(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.lab2Service.getPremiumCourses(userId, labId, authHeader);
  }
}
