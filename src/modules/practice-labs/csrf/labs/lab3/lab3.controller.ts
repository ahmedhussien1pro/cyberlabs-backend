// src/modules/practice-labs/csrf/labs/lab3/lab3.controller.ts
import { Controller, Post, Get, Body, Query, Headers, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/csrf/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  // ── read-only / init ────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  @SkipThrottle()
  @Post('grades/view')
  viewGrades(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.viewGrades(userId, labId);
  }

  // ── reset ───────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  reset(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  // ── vulnerable endpoints ────────────────────────────────────────────
  // ❌ State-changing action via GET + SameSite=Lax bypass
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('grades/update')
  updateGrade(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('studentId') studentId: string,
    @Body('courseId') courseId: string,
    @Body('grade') grade: string,
    @Headers('origin') origin?: string,
  ) {
    return this.lab3Service.updateGrade(userId, labId, studentId, courseId, grade, origin);
  }

  // Simulate SameSite=Lax top-level navigation bypass
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('csrf/simulate-victim-navigation')
  simulateNavigation(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('studentId') studentId: string,
    @Body('courseId') courseId: string,
    @Body('grade') grade: string,
  ) {
    return this.lab3Service.simulateNavigation(userId, labId, studentId, courseId, grade);
  }
}
