import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';

// Controllers
import { AuthController } from './controllers/auth.controller';
import { OAuthController } from './controllers/oauth.controller';

// Services
import {
  AuthService,
  JwtTokenService,
  EmailVerificationService,
  PasswordResetService,
  TwoFactorService,
} from './services';

// Strategies
import { JwtStrategy, GoogleStrategy, GithubStrategy } from './strategies';

// Core modules
import { DatabaseModule } from '../../core/database';
import { SecurityModule } from '../../core/security';
import { LoggerModule } from '../../core/logger';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    DatabaseModule,
    SecurityModule,
    LoggerModule,
  ],
  controllers: [AuthController, OAuthController],
  providers: [
    // Services
    AuthService,
    JwtTokenService,
    EmailVerificationService,
    PasswordResetService,
    TwoFactorService,
    // Strategies
    JwtStrategy,
    GoogleStrategy,
    GithubStrategy,
  ],
  exports: [AuthService, JwtTokenService],
})
export class AuthModule {}
