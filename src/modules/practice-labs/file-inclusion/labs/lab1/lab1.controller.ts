// src/modules/practice-labs/file-inclusion/labs/lab1/lab1.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/file-inclusion/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  @Post('cms/templates')
  listTemplates(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.listTemplates(userId, labId);
  }

  // ❌ الثغرة: template parameter بدون path sanitization
  @Post('page/load')
  loadPage(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('template') template: string,
  ) {
    return this.lab1Service.loadPage(userId, labId, template);
  }
}
