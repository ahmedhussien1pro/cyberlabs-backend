// src/modules/auth/controllers/auth.controller.ts

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response, Request, CookieOptions } from 'express';
import { AuthService } from '../services/auth.service';
import { EmailVerificationService } from '../services/email-verification.service';
import { PasswordResetService } from '../services/password-reset.service';
import { TwoFactorService } from '../services/two-factor.service';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyOTPDto,
} from '../dto';
import { JwtAuthGuard } from '../../../common/guards';
import { Public } from '../../../common/decorators';
import { CurrentUser } from '../../../common/decorators';
import type { RequestUser } from '../../../common/types';
import { Serialize } from '../../../common/decorators';
import { AuthResponseSerializer } from '../serializers';

// ── httpOnly Cookie helpers ─────────────────────────────────────────────────
const REFRESH_COOKIE = 'cyb_rt';

function getRefreshCookieOpts(): CookieOptions {
  const isProd = process.env.NODE_ENV !== 'development';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    ...(isProd
      ? { domain: process.env.COOKIE_DOMAIN ?? '.cyber-labs.tech' }
      : {}),
    path: '/api/v1/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

function clearRefreshCookieOpts(): CookieOptions {
  const isProd = process.env.NODE_ENV !== 'development';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    ...(isProd
      ? { domain: process.env.COOKIE_DOMAIN ?? '.cyber-labs.tech' }
      : {}),
    path: '/api/v1/auth/refresh',
  };
}
// ───────────────────────────────────────────────────────────────────────────

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private emailVerificationService: EmailVerificationService,
    private passwordResetService: PasswordResetService,
    private twoFactorService: TwoFactorService,
  ) {}

  // ==================== Authentication ====================

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Serialize(AuthResponseSerializer)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    res.cookie(REFRESH_COOKIE, result.refreshToken, getRefreshCookieOpts());
    return result;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Serialize(AuthResponseSerializer)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    res.cookie(REFRESH_COOKIE, result.refreshToken, getRefreshCookieOpts());
    return result;
  }

  /**
   * Dual-mode refresh:
   *  - Cookie mode  (*.cyber-labs.tech): reads cyb_rt cookie automatically
   *  - Legacy mode  (localhost dev)    : reads refreshToken from body
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body('refreshToken') bodyRefreshToken: string | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as Record<string, string> | undefined;
    const cookieToken = cookies?.[REFRESH_COOKIE];
    const refreshToken = cookieToken || bodyRefreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const result = await this.authService.refreshToken(refreshToken);
    res.cookie(REFRESH_COOKIE, result.refreshToken, getRefreshCookieOpts());
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: RequestUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.clearCookie(REFRESH_COOKIE, clearRefreshCookieOpts());
    return this.authService.logout(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: RequestUser) {
    return { success: true, user };
  }

  // ==================== Email Verification ====================

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.emailVerificationService.verifyEmail(dto.token);
    return { success: true, message: 'Email verified successfully' };
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.emailVerificationService.resendVerificationEmail(dto.email);
    return { success: true, message: 'Verification email sent successfully' };
  }

  // ==================== Password Management ====================

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.passwordResetService.sendPasswordResetEmail(dto.email);
    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.passwordResetService.resetPassword(dto.token, dto.newPassword);
    return { success: true, message: 'Password reset successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: RequestUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.passwordResetService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
    return { success: true, message: 'Password changed successfully' };
  }

  // ==================== Two-Factor Authentication ====================

  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  @HttpCode(HttpStatus.OK)
  async generateTwoFactor(@CurrentUser() user: RequestUser) {
    const result = await this.twoFactorService.generateTwoFactorSecret(user.id);
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  async enableTwoFactor(
    @CurrentUser() user: RequestUser,
    @Body() body: { code: string },
  ) {
    const result = await this.twoFactorService.enableTwoFactor(
      user.id,
      body.code,
    );
    return { success: true, ...result };
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  async disableTwoFactor(
    @CurrentUser() user: RequestUser,
    @Body() body: { code: string },
  ) {
    const result = await this.twoFactorService.disableTwoFactor(
      user.id,
      body.code,
    );
    return { success: true, ...result };
  }

  @Public()
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  async verifyTwoFactor(@Body() body: { userId: string; code: string }) {
    const isValid = await this.twoFactorService.verifyTwoFactorCode(
      body.userId,
      body.code,
    );
    return isValid
      ? { success: true, message: 'Code verified successfully' }
      : { success: false, message: 'Invalid verification code' };
  }

  @Public()
  @Post('verify-email-otp')
  @HttpCode(HttpStatus.OK)
  async verifyEmailWithOTP(@Body() dto: VerifyOTPDto) {
    await this.emailVerificationService.verifyEmailWithOTP(dto.email, dto.otp);
    return { success: true, message: 'Email verified successfully' };
  }
}
