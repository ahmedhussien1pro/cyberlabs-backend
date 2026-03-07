import {
  Controller,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards';
import { CurrentUser } from '../../../common/decorators';
import { ProfileService } from '../services/profile.service';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /** GET /profile/achievements — earned + in-progress achievements */
  @Get('achievements')
  @HttpCode(HttpStatus.OK)
  async getAchievements(@CurrentUser('id') userId: string) {
    return {
      success: true,
      data: await this.profileService.getAchievements(userId),
    };
  }

  /** GET /profile/skills — user's tracked skills with level + progress */
  @Get('skills')
  @HttpCode(HttpStatus.OK)
  async getSkills(@CurrentUser('id') userId: string) {
    return {
      success: true,
      data: await this.profileService.getSkills(userId),
    };
  }

  /** GET /profile/certificates — issued certificates */
  @Get('certificates')
  @HttpCode(HttpStatus.OK)
  async getCertificates(@CurrentUser('id') userId: string) {
    return {
      success: true,
      data: await this.profileService.getCertificates(userId),
    };
  }

  /** GET /profile/activity — last 30 days activity */
  @Get('activity')
  @HttpCode(HttpStatus.OK)
  async getActivity(@CurrentUser('id') userId: string) {
    return {
      success: true,
      data: await this.profileService.getActivity(userId),
    };
  }
}
