import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/path-traversal/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  @Get('view-document')
  async viewDocument(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('document') document: string,
  ) {
    return this.lab3Service.viewDocument(userId, labId, document);
  }

  @Post('state')
  async getState(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.getState(userId, labId);
  }
}
