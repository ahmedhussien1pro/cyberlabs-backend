import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Lab5Service } from './lab5.service';
import { JwtAuthGuard } from '../../../../../core/auth/guards/jwt-auth.guard';

@Controller('practice-labs/sqli-time-based')
@UseGuards(JwtAuthGuard)
export class Lab5Controller {
  constructor(private readonly lab5: Lab5Service) {}

  @Get('init')
  init(@Req() req: any) {
    return this.lab5.initLab(req.user.id, 'sqli-time-based');
  }

  @Get('account')
  lookupAccount(@Req() req: any, @Query('id') id: string) {
    return this.lab5.lookupAccount(req.user.id, 'sqli-time-based', id ?? '1');
  }
}
