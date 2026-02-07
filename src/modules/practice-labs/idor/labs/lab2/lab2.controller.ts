import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/idor/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  @Get('files')
  async listFiles(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.listFiles(userId, labId);
  }

  @Get('files/:fileId')
  async readFile(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Param('fileId') fileId: string,
  ) {
    return this.lab2Service.readFile(userId, labId, fileId);
  }
}
