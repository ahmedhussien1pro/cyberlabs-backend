import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('api/v1/practice-labs/api-hacking/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  @Get('documents')
  async listDocuments(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
  ) {
    return this.lab1Service.listDocuments(userId, labId);
  }

  @Get('documents/:id')
  async getDocument(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Param('id') documentId: string,
  ) {
    return this.lab1Service.getDocument(userId, labId, documentId);
  }

  @Put('documents/:id')
  async updateDocument(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Param('id') documentId: string,
    @Body('title') title: string,
  ) {
    return this.lab1Service.updateDocument(userId, labId, documentId, title);
  }

  @Delete('documents/:id')
  async deleteDocument(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Param('id') documentId: string,
  ) {
    return this.lab1Service.deleteDocument(userId, labId, documentId);
  }
}
