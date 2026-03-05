// src/modules/practice-labs/command-injection/labs/lab1/lab1.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/command-injection/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  @Post('network/info')
  getInfo(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.getInfo(userId, labId);
  }

  // ❌ الثغرة: user input يدخل مباشرة في shell command
  @Post('network/ping')
  ping(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('host') host: string,
  ) {
    return this.lab1Service.ping(userId, labId, host);
  }
}
