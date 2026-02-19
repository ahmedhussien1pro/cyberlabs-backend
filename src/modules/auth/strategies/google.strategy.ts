import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID:
        configService.get<string>('oauth.google.clientId') ||
        '127755824678-m9divm934mn0epmi0k3m0rob64ba4m38.apps.googleusercontent.com',
      clientSecret:
        configService.get<string>('oauth.google.clientSecret') ||
        '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',
      callbackURL:
        configService.get<string>('oauth.google.callbackUrl') ||
        'https://cyberlabs-backend-v1.vercel.app/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const user = {
      provider: 'google',
      providerId: id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      avatar: photos[0]?.value || null,
      accessToken,
      refreshToken,
    };

    done(null, user);
  }
}
