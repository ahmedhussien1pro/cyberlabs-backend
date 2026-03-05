// src/modules/practice-labs/broken-auth/labs/lab5/lab5.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab5Service } from './lab5.service';

@Controller('practice-labs/broken-auth/lab5')
@UseGuards(JwtAuthGuard)
export class Lab5Controller {
  constructor(private lab5Service: Lab5Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.initLab(userId, labId);
  }

  @Post('auth/login')
  login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.lab5Service.labLogin(userId, labId, email, password);
  }

  // ❌ الثغرة: OTP check بدون atomic operation → race condition
  @Post('auth/verify-otp')
  verifyOtp(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('sessionId') sessionId: string,
    @Body('otp') otp: string,
  ) {
    return this.lab5Service.verifyOtp(userId, labId, sessionId, otp);
  }

  // محاكاة race condition attack — إرسال طلبات متزامنة
  @Post('auth/race-otp-attack')
  raceOtpAttack(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('sessionId') sessionId: string,
    @Body('otpGuesses') otpGuesses: string[],
  ) {
    return this.lab5Service.raceOtpAttack(userId, labId, sessionId, otpGuesses);
  }

  @Post('banking/dashboard')
  bankingDashboard(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('accessToken') accessToken: string,
  ) {
    return this.lab5Service.bankingDashboard(userId, labId, accessToken);
  }
}
