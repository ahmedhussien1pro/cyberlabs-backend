// src/modules/practice-labs/csrf/labs/lab3/lab3.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/csrf/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  @Post('grades/view')
  viewGrades(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.viewGrades(userId, labId);
  }

  // ❌ الثغرة: GET request يغير state + SameSite=Lax bypass
  @Post('grades/update')
  updateGrade(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('studentId') studentId: string,
    @Body('courseId') courseId: string,
    @Body('grade') grade: string,
    @Headers('origin') origin?: string,
  ) {
    return this.lab3Service.updateGrade(
      userId,
      labId,
      studentId,
      courseId,
      grade,
      origin,
    );
  }

  // محاكاة top-level GET navigation (SameSite=Lax bypass)
  @Post('csrf/simulate-victim-navigation')
  simulateNavigation(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('studentId') studentId: string,
    @Body('courseId') courseId: string,
    @Body('grade') grade: string,
  ) {
    return this.lab3Service.simulateNavigation(
      userId,
      labId,
      studentId,
      courseId,
      grade,
    );
  }
}
