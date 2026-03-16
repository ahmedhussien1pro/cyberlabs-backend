import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Lab4Service } from './lab4.service';
import { JwtAuthGuard } from '../../../../../common/guards/jwt-auth.guard';

@Controller('practice-labs/sqli-error-based')
@UseGuards(JwtAuthGuard)
export class Lab4Controller {
  constructor(private readonly lab4: Lab4Service) {}

  @Get('init')
  init(@Req() req: any) {
    return this.lab4.initLab(req.user.id, 'sqli-error-based');
  }

  @Get('user')
  lookupUser(@Req() req: any, @Query('id') id: string) {
    return this.lab4.lookupUser(req.user.id, 'sqli-error-based', id ?? '1');
  }
}
