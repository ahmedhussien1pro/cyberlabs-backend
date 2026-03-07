import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BadgesService } from './badges.service';
import { JwtAuthGuard } from '../../common/guards';

@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  /**
   * GET /badges
   * All badges catalog — no auth required.
   */
  @Get()
  async getAllBadges() {
    const data = await this.badgesService.getAllBadges();
    return { success: true, data };
  }

  /**
   * GET /badges/me
   * Full catalog with earned/locked status for the authenticated user.
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getBadgesWithStatus(@Request() req: any) {
    const data = await this.badgesService.getBadgesWithStatus(req.user.id);
    return { success: true, data };
  }

  /**
   * GET /badges/my
   * Only badges the authenticated user has earned.
   */
  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyBadges(@Request() req: any) {
    const data = await this.badgesService.getUserBadges(req.user.id);
    return { success: true, data };
  }

  /**
   * POST /badges/backfill-my-badges
   * Retroactively awards all earned badges + issues missing certificates.
   * Safe to call multiple times — all operations are idempotent.
   */
  @UseGuards(JwtAuthGuard)
  @Post('backfill-my-badges')
  @HttpCode(HttpStatus.OK)
  async backfillMyBadges(@Request() req: any) {
    const awarded = await this.badgesService.backfillUserBadges(req.user.id);
    return {
      success: true,
      message: `Backfill complete. Awarded ${awarded.length} new badge(s).`,
      awarded,
    };
  }
}
