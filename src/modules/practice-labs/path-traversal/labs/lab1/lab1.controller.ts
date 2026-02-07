import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/path-traversal/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  @Get('view-image')
  async viewImage(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('filename') filename: string,
  ) {
    return this.lab1Service.readFile(userId, labId, filename);
  }

  @Get('download-file')
  async downloadFile(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('path') path: string,
  ) {
    return this.lab1Service.downloadFile(userId, labId, path);
  }

  @Post('state')
  async getState(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.getState(userId, labId);
  }
}
