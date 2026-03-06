import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { BadgesService } from './badges.service';
import { JwtAuthGuard } from '../../common/guards';

@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  /**
   * GET /badges
   * All badges catalog — no auth required.
   * Used for the public badges explorer page.
   */
  @Get()
  async getAllBadges() {
    const data = await this.badgesService.getAllBadges();
    return { success: true, data };
  }

  /**
   * GET /badges/me
   * Full catalog with earned/locked status for the authenticated user.
   * Used by the dashboard BadgesCard (all tabs: all / earned / locked).
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
   * Used by the Profile badges section.
   */
  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyBadges(@Request() req: any) {
    const data = await this.badgesService.getUserBadges(req.user.id);
    return { success: true, data };
  }
}
