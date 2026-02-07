import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/file-upload/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  @Post('upload')
  async upload(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('fileName') fileName: string,
    @Body('fileSize') fileSize: number,
    @Body('fileContent') fileContent: string,
  ) {
    return this.lab1Service.uploadFile(
      userId,
      labId,
      fileName,
      fileSize,
      fileContent,
    );
  }

  @Post('upload-custom-name')
  async uploadCustomName(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('fileName') fileName: string,
    @Body('fileContent') fileContent: string,
  ) {
    return this.lab1Service.uploadWithCustomName(
      userId,
      labId,
      fileName,
      fileContent,
    );
  }

  @Post('upload-double-ext')
  async uploadDoubleExt(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('fileName') fileName: string,
    @Body('fileContent') fileContent: string,
  ) {
    return this.lab1Service.uploadWithDoubleExtension(
      userId,
      labId,
      fileName,
      fileContent,
    );
  }

  @Get('files')
  async listFiles(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
  ) {
    return this.lab1Service.listFiles(userId, labId);
  }

  @Get('file')
  async getFile(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('fileId') fileId: string,
  ) {
    return this.lab1Service.getFile(userId, labId, fileId);
  }

  @Get('hints')
  async getHints(@GetUser('id') userId: string, @Query('labId') labId: string) {
    return this.lab1Service.getHints(userId, labId);
  }
}
