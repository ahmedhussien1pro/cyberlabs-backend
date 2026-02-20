// src/modules/contact/contact.controller.ts
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../..//common/decorators';
import { MailService } from '../../core/mail';
import { CreateContactDto } from './dto/create-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly mailService: MailService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  async send(@Body() dto: CreateContactDto) {
    await this.mailService.sendContactEmail(dto);
    return { message: 'Message sent successfully' };
  }
}
