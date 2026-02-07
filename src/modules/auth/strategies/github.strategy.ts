import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    super({
      clientID:
        configService.get<string>('oauth.github.clientId') ||
        'Ov23liBihr1jiieVxK12',
      clientSecret:
        configService.get<string>('oauth.github.clientSecret') ||
        '79424fd15d60b82753917c34dcadd886ce088c15',
      callbackURL:
        configService.get<string>('oauth.github.callbackUrl') ||
        'https://cyberlabs-tech-dhzpa.ondigitalocean.app/api/v1/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: any,
  ): Promise<any> {
    const { id, username, emails, photos } = profile;

    const user = {
      provider: 'github',
      providerId: id,
      email: emails?.[0]?.value || `${username}@github.com`,
      firstName: profile.displayName?.split(' ')[0] || username,
      lastName: profile.displayName?.split(' ')[1] || '',
      avatar: photos?.[0]?.value || null,
      accessToken,
      refreshToken,
    };

    done(null, user);
  }
}
