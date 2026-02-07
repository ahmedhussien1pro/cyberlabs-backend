import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
} from '@nestjs/common';
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
  RefreshTokenDto,
} from '../dto';
import { JwtAuthGuard } from '../../../common/guards';
import { Public } from '../../../common/decorators';
import { CurrentUser } from '../../../common/decorators';
import type { RequestUser } from '../../../common/types';
import { Serialize } from '../../../common/decorators';
import { AuthResponseSerializer } from '../serializers';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private emailVerificationService: EmailVerificationService,
    private passwordResetService: PasswordResetService,
    private twoFactorService: TwoFactorService,
  ) {}

  // ==================== Authentication ====================

  /**
   * Register new user
   * POST /api/v1/auth/register
   * @public
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Serialize(AuthResponseSerializer)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   * @public
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Serialize(AuthResponseSerializer)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   * @public
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   * @protected
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: RequestUser) {
    return this.authService.logout(user.id);
  }

  /**
   * Get current authenticated user
   * GET /api/v1/auth/me
   * @protected
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: RequestUser) {
    return {
      success: true,
      user,
    };
  }

  // ==================== Email Verification ====================

  /**
   * Verify email with token
   * POST /api/v1/auth/verify-email
   * @public
   */
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.emailVerificationService.verifyEmail(dto.token);
    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  /**
   * Resend verification email
   * POST /api/v1/auth/resend-verification
   * @public
   */
  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.emailVerificationService.resendVerificationEmail(dto.email);
    return {
      success: true,
      message: 'Verification email sent successfully',
    };
  }

  // ==================== Password Management ====================

  /**
   * Request password reset email
   * POST /api/v1/auth/forgot-password
   * @public
   */
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

  /**
   * Reset password with token
   * POST /api/v1/auth/reset-password
   * @public
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.passwordResetService.resetPassword(dto.token, dto.newPassword);
    return {
      success: true,
      message: 'Password reset successfully',
    };
  }

  /**
   * Change password (authenticated users)
   * POST /api/v1/auth/change-password
   * @protected
   */
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
    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  // ==================== Two-Factor Authentication ====================

  /**
   * Generate 2FA secret and QR code
   * POST /api/v1/auth/2fa/generate
   * @protected
   */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  @HttpCode(HttpStatus.OK)
  async generateTwoFactor(@CurrentUser() user: RequestUser) {
    const result = await this.twoFactorService.generateTwoFactorSecret(user.id);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Enable 2FA by verifying code
   * POST /api/v1/auth/2fa/enable
   * @protected
   */
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
    return {
      success: true,
      ...result,
    };
  }

  /**
   * Disable 2FA
   * POST /api/v1/auth/2fa/disable
   * @protected
   */
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
    return {
      success: true,
      ...result,
    };
  }

  /**
   * Verify 2FA code during login
   * POST /api/v1/auth/2fa/verify
   * @public
   */
  @Public()
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  async verifyTwoFactor(@Body() body: { userId: string; code: string }) {
    const isValid = await this.twoFactorService.verifyTwoFactorCode(
      body.userId,
      body.code,
    );

    if (!isValid) {
      return {
        success: false,
        message: 'Invalid verification code',
      };
    }

    return {
      success: true,
      message: 'Code verified successfully',
    };
  }
}
