import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/file-inclusion/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  @Get('page')
  async loadPage(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('page') page: string,
  ) {
    return this.lab1Service.includePage(userId, labId, page);
  }

  @Get('template')
  async loadTemplate(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('file') file: string,
  ) {
    return this.lab1Service.includeTemplate(userId, labId, file);
  }

  @Post('state')
  async getState(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.getState(userId, labId);
  }
}
