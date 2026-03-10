import {
  Controller, Post, Get, Body, Param,
  Req, UseGuards, Query,
} from '@nestjs/common';
import { Request } from 'express';
import { TrackingService } from './tracking.service';
import { TrackEntryDto } from './dto/track-entry.dto';
import { TrackActionDto } from './dto/track-action.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  // Public: record landing / utm entry
  @Public()
  @Post('entry')
  async trackEntry(@Body() dto: TrackEntryDto, @Req() req: Request) {
    const userId    = (req as any)?.user?.id ?? undefined;
    const ip        = req.ip ?? req.headers['x-forwarded-for']?.toString();
    const userAgent = req.headers['user-agent'];
    return this.trackingService.trackEntry(dto, userId, ip, userAgent);
  }

  // Public: record action (click / view / enroll etc.)
  @Public()
  @Post('action')
  async trackAction(@Body() dto: TrackActionDto, @Req() req: Request) {
    const userId    = (req as any)?.user?.id ?? undefined;
    const ip        = req.ip ?? req.headers['x-forwarded-for']?.toString();
    const userAgent = req.headers['user-agent'];
    return this.trackingService.trackAction(dto, userId, ip, userAgent);
  }

  // Authenticated: user's own referral stats
  @Get('referral-stats/:userId')
  async getReferralStats(@Param('userId') userId: string) {
    return this.trackingService.getReferralStats(userId);
  }

  // Admin: full funnel & conversion stats
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('admin/stats')
  async getAdminStats() {
    return this.trackingService.getAdminStats();
  }

  // Admin: referral leaderboard
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('admin/leaderboard')
  async getReferralLeaderboard(@Query('limit') limit?: string) {
    return this.trackingService.getReferralLeaderboard(limit ? parseInt(limit) : 50);
  }
}
