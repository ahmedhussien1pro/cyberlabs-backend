import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Lab3Service } from './lab3.service';
import { JwtAuthGuard } from '../../../../../common/guards/jwt-auth.guard';

@Controller('practice-labs/sqli-blind-boolean')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private readonly lab3: Lab3Service) {}

  @Get('init')
  init(@Req() req: any) {
    return this.lab3.initLab(req.user.id, 'sqli-blind-boolean');
  }

  @Get('article')
  getArticle(@Req() req: any, @Query('id') id: string) {
    return this.lab3.getArticle(req.user.id, 'sqli-blind-boolean', id ?? '5');
  }
}
