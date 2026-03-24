// src/modules/practice-labs/bash-scripting/labs/lab2/lab2.controller.ts
import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/bash-scripting/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  @Post('start')
  start(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab2Service.initLab(userId, labId);
  }

  @Get('challenge')
  challenge(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
  ) {
    return this.lab2Service.getChallenge(userId, labId);
  }

  @Post('command')
  command(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('cmd') cmd: string,
  ) {
    return this.lab2Service.runCommand(userId, labId, cmd);
  }

  @Post('verify-step')
  verifyStep(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('step') step: string,
    @Body('answer') answer: string,
  ) {
    return this.lab2Service.verifyStep(userId, labId, step, answer);
  }

  @Get('progress')
  progress(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
  ) {
    return this.lab2Service.getProgress(userId, labId);
  }

  /** POST /submit { labId } — no flag input, server generates flag */
  @Post('submit')
  submit(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab2Service.submitFlag(userId, labId);
  }
}
