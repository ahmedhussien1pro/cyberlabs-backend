import {
  Controller, Get, Post, Delete,
  Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AdminReferralsService } from './admin-referrals.service';
import { AdminGuard } from '../../common/guards';
import { CreateReferralLinkDto } from './dto/create-referral-link.dto';

/**
 * AdminReferralsController
 * Route namespace: /admin/referrals
 * Protection: AdminGuard
 */
@UseGuards(AdminGuard)
@Controller('admin/referrals')
export class AdminReferralsController {
  constructor(private readonly referralsService: AdminReferralsService) {}

  /** GET /admin/referrals/stats */
  @Get('stats')
  getStats() {
    return this.referralsService.getStats();
  }

  /** GET /admin/referrals */
  @Get()
  findAll() {
    return this.referralsService.findAll();
  }

  /** POST /admin/referrals */
  @Post()
  create(@Body() dto: CreateReferralLinkDto) {
    return this.referralsService.create(dto);
  }

  /** DELETE /admin/referrals/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.referralsService.remove(id);
  }
}
