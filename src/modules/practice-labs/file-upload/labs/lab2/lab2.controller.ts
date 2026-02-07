import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/file-upload/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  @Post('upload-mime')
  async uploadMime(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('fileName') fileName: string,
    @Body('mimeType') mimeType: string,
    @Body('fileContent') fileContent: string,
  ) {
    return this.lab2Service.uploadWithMimeCheck(
      userId,
      labId,
      fileName,
      mimeType,
      fileContent,
    );
  }

  @Post('upload-content')
  async uploadContent(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('fileName') fileName: string,
    @Body('fileContent') fileContent: string,
  ) {
    return this.lab2Service.uploadWithContentCheck(
      userId,
      labId,
      fileName,
      fileContent,
    );
  }

  @Post('upload-polyglot')
  async uploadPolyglot(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('fileName') fileName: string,
    @Body('fileContent') fileContent: string,
  ) {
    return this.lab2Service.uploadPolyglot(
      userId,
      labId,
      fileName,
      fileContent,
    );
  }

  @Post('upload-svg')
  async uploadSvg(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('fileName') fileName: string,
    @Body('svgContent') svgContent: string,
  ) {
    return this.lab2Service.uploadSvg(userId, labId, fileName, svgContent);
  }

  @Get('files')
  async listFiles(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
  ) {
    return this.lab2Service.listFiles(userId, labId);
  }

  @Get('hints')
  async getHints(@GetUser('id') userId: string, @Query('labId') labId: string) {
    return this.lab2Service.getHints(userId, labId);
  }
}
