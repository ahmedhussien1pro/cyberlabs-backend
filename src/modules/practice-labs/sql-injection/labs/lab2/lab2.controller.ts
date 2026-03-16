import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Lab2Service } from './lab2.service';
import { JwtAuthGuard } from '../../../../../core/auth/guards/jwt-auth.guard';

@Controller('practice-labs/sqli-union-extract')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private readonly lab2: Lab2Service) {}

  @Get('init')
  init(@Req() req: any) {
    return this.lab2.initLab(req.user.id, 'sqli-union-extract');
  }

  @Get('search')
  search(@Req() req: any, @Query('q') q: string) {
    return this.lab2.search(req.user.id, 'sqli-union-extract', q ?? '');
  }
}
