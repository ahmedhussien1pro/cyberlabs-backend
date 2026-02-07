import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../../common/decorators';
import { LoggerService } from '../../../core/logger';

@Controller('auth')
export class OAuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.logger.setContext('OAuthController');
  }

  // ==================== Google OAuth ====================

  /**
   * Google OAuth - Initiate authentication
   * GET /api/v1/auth/google
   * @public
   */
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard redirects to Google OAuth page
  }

  /**
   * Google OAuth - Callback handler
   * GET /api/v1/auth/google/callback
   * @public
   */
  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    try {
      const result = await this.authService.oauthLogin(req.user);

      this.logger.log(`Google OAuth successful for: ${req.user.email}`);

      const frontendUrl =
        this.configService.get<string>('app.frontendUrl') ||
        'http://localhost:5173';

      const redirectUrl = `${frontendUrl}/auth/callback?access_token=${result.accessToken}&refresh_token=${result.refreshToken}&expires_in=${result.expiresIn}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error('Google OAuth error', error.stack);

      const frontendUrl =
        this.configService.get<string>('app.frontendUrl') ||
        'http://localhost:5173';

      return res.redirect(`${frontendUrl}/auth/error?message=oauth_failed`);
    }
  }

  // ==================== GitHub OAuth ====================

  /**
   * GitHub OAuth - Initiate authentication
   * GET /api/v1/auth/github
   * @public
   */
  @Public()
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // Guard redirects to GitHub OAuth page
  }

  /**
   * GitHub OAuth - Callback handler
   * GET /api/v1/auth/github/callback
   * @public
   */
  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Req() req: any, @Res() res: Response) {
    try {
      const result = await this.authService.oauthLogin(req.user);

      this.logger.log(`GitHub OAuth successful for: ${req.user.email}`);

      const frontendUrl =
        this.configService.get<string>('app.frontendUrl') ||
        'http://localhost:5173';

      const redirectUrl = `${frontendUrl}/auth/callback?access_token=${result.accessToken}&refresh_token=${result.refreshToken}&expires_in=${result.expiresIn}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error('GitHub OAuth error', error.stack);

      const frontendUrl =
        this.configService.get<string>('app.frontendUrl') ||
        'http://localhost:5173';

      return res.redirect(`${frontendUrl}/auth/error?message=oauth_failed`);
    }
  }
}
