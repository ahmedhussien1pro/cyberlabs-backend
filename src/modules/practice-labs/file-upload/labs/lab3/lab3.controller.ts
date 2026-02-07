import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/file-upload/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  @Post('upload-path')
  async uploadPath(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('fileName') fileName: string,
    @Body('filePath') filePath: string,
    @Body('fileContent') fileContent: string,
  ) {
    return this.lab3Service.uploadToPath(
      userId,
      labId,
      fileName,
      filePath,
      fileContent,
    );
  }

  @Post('upload-absolute')
  async uploadAbsolute(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('fullPath') fullPath: string,
    @Body('fileContent') fileContent: string,
  ) {
    return this.lab3Service.uploadAbsolutePath(
      userId,
      labId,
      fullPath,
      fileContent,
    );
  }

  @Post('upload-separators')
  async uploadSeparators(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('fileName') fileName: string,
    @Body('fileContent') fileContent: string,
  ) {
    return this.lab3Service.uploadWithSeparators(
      userId,
      labId,
      fileName,
      fileContent,
    );
  }

  @Post('upload-zip')
  async uploadZip(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('zipFileName') zipFileName: string,
    @Body('zipContents') zipContents: Array<{ name: string; content: string }>,
  ) {
    return this.lab3Service.uploadZip(userId, labId, zipFileName, zipContents);
  }

  @Post('overwrite')
  async overwrite(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('targetFile') targetFile: string,
    @Body('newContent') newContent: string,
  ) {
    return this.lab3Service.uploadOverwrite(
      userId,
      labId,
      targetFile,
      newContent,
    );
  }

  @Get('files')
  async listFiles(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
  ) {
    return this.lab3Service.listFiles(userId, labId);
  }

  @Get('hints')
  async getHints(@GetUser('id') userId: string, @Query('labId') labId: string) {
    return this.lab3Service.getHints(userId, labId);
  }
}
