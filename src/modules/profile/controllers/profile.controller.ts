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

  @Get('achievements')
  @HttpCode(HttpStatus.OK)
  async getAchievements(@CurrentUser('id') userId: string) {
    return {
      success: true,
      data: await this.profileService.getAchievements(userId),
    };
  }

  @Get('certificates')
  @HttpCode(HttpStatus.OK)
  async getCertificates(@CurrentUser('id') userId: string) {
    return {
      success: true,
      data: await this.profileService.getCertificates(userId),
    };
  }

  @Get('activity')
  @HttpCode(HttpStatus.OK)
  async getActivity(@CurrentUser('id') userId: string) {
    return {
      success: true,
      data: await this.profileService.getActivity(userId),
    };
  }
}
