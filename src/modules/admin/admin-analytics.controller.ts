import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminGuard } from '../../common/guards';

/**
 * AdminAnalyticsController
 *
 * Provides aggregated platform metrics for the admin dashboard.
 * All endpoints protected by AdminGuard.
 *
 * Routes:
 *   GET /admin/analytics/overview         → Platform totals (users, courses, labs, XP)
 *   GET /admin/analytics/growth           → Monthly growth trends (last 12 months)
 *   GET /admin/analytics/engagement       → Activity metrics (last 30 days)
 *   GET /admin/analytics/top-content      → Top courses & labs
 *   GET /admin/analytics/recent-activity  → Last 20 events
 */
@UseGuards(AdminGuard)
@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AdminAnalyticsService) {}

  /**
   * GET /admin/analytics/overview
   * High-level KPIs: total users, courses, labs, enrollments, XP, points.
   */
  @Get('overview')
  getOverview() {
    return this.analyticsService.getOverview();
  }

  /**
   * GET /admin/analytics/growth
   * Monthly user and enrollment growth (last 12 months).
   * Returns arrays of { month, count } for charting.
   */
  @Get('growth')
  getGrowthTrends() {
    return this.analyticsService.getGrowthTrends();
  }

  /**
   * GET /admin/analytics/engagement
   * Activity metrics over the last 30 days:
   *  - activeUsers (logged in)
   *  - labLaunches
   *  - submissions
   *  - avgSessionDuration (seconds)
   */
  @Get('engagement')
  getEngagementMetrics() {
    return this.analyticsService.getEngagementMetrics();
  }

  /**
   * GET /admin/analytics/top-content
   * Top 10 courses (by enrollment) + top 10 labs (by completion).
   */
  @Get('top-content')
  getTopContent() {
    return this.analyticsService.getTopContent();
  }

  /**
   * GET /admin/analytics/recent-activity
   * Last 20 platform events (new users, enrollments, lab completions)
   * sorted by timestamp descending.
   */
  @Get('recent-activity')
  getRecentActivity() {
    return this.analyticsService.getRecentActivity();
  }
}
