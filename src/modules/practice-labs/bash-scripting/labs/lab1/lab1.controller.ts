// src/modules/practice-labs/bash-scripting/labs/lab1/lab1.controller.ts
import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/bash-scripting/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  @Post('start')
  start(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab1Service.initLab(userId, labId);
  }

  @Get('challenge')
  challenge(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
  ) {
    return this.lab1Service.getChallenge(userId, labId);
  }

  @Post('verify-step')
  verifyStep(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('step') step: string,
    @Body('answer') answer: string,
  ) {
    return this.lab1Service.verifyStep(userId, labId, step, answer);
  }

  @Get('progress')
  progress(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
  ) {
    return this.lab1Service.getProgress(userId, labId);
  }

  /** POST /submit { labId } — no flag input, server generates flag */
  @Post('submit')
  submit(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab1Service.submitFlag(userId, labId);
  }
}
