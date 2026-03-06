// src/modules/practice-labs/file-inclusion/labs/lab2/lab2.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/file-inclusion/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  @Post('invoice/templates')
  listTemplates(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.listTemplates(userId, labId);
  }

  // ❌ الثغرة: يقبل php:// wrappers
  @Post('invoice/render')
  renderInvoice(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('file') file: string,
    @Body('invoiceId') invoiceId: string,
  ) {
    return this.lab2Service.renderInvoice(userId, labId, file, invoiceId);
  }

  // مساعد: decode base64
  @Post('utils/decode-base64')
  decodeBase64(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('data') data: string,
  ) {
    return this.lab2Service.decodeBase64(userId, labId, data);
  }
}
