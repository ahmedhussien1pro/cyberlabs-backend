import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import axios from 'axios';

@Injectable()
export class Lab3Service {
  private readonly FLAG = 'FLAG{SSRF_0P3N_R3D1R3CT_2_M3T4D4T4}';

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async getState(userId: string, labId: string) {
    const instance = await this.prisma.labInstance.findUnique({
      where: {
        userId_labId: { userId, labId },
      },
    });

    if (!instance) {
      throw new NotFoundException(
        'Lab instance not found. Please start the lab first.',
      );
    }

    return {
      success: true,
      state: instance.state,
      isActive: instance.isActive,
      startedAt: instance.startedAt,
      hint: 'Use the /redirect endpoint to chain with profile fetching',
    };
  }

  /**
   * ⚠️ VULNERABLE: Open redirect
   */
  async handleRedirect(url: string) {
    if (!url) {
      throw new BadRequestException('URL parameter is required');
    }

    // ⚠️ VULNERABILITY: No validation on redirect URL
    return {
      statusCode: 302,
      redirectUrl: url,
      message: 'Redirecting...',
    };
  }

  /**
   * ⚠️ VULNERABLE: SSRF via profile fetcher
   */
  async fetchUserProfile(userId: string, labId: string, profileUrl: string) {
    if (!profileUrl) {
      throw new BadRequestException('Profile URL is required');
    }

    const progress = await this.prisma.userLabProgress.findUnique({
      where: {
        userId_labId: { userId, labId },
      },
    });

    if (!progress) {
      throw new NotFoundException(
        'Lab progress not found. Please start the lab first.',
      );
    }

    try {
      // ⚠️ VULNERABILITY: Follows redirects without validation
      const response = await axios.get(profileUrl, {
        timeout: 5000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
      });

      const content =
        typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data);

      await this.prisma.userLabProgress.update({
        where: { id: progress.id },
        data: {
          attempts: { increment: 1 },
          lastAccess: new Date(),
        },
      });

      const flagPattern = new RegExp(this.FLAG);
      const flagFound = flagPattern.test(content);

      if (flagFound) {
        await this.prisma.userLabProgress.update({
          where: { id: progress.id },
          data: {
            flagSubmitted: true,
            completedAt: new Date(),
            progress: 100,
          },
        });

        await this.prisma.labSubmission.create({
          data: {
            userId,
            labId,
            flagAnswer: this.FLAG,
            isCorrect: true,
            attemptNumber: progress.attempts + 1,
            timeTaken: 0,
            code: profileUrl,
          },
        });

        return {
          success: true,
          profile: content,
          exploited: true,
          flag: this.FLAG,
          message: '🎉 SSRF via open redirect successful!',
          hint: 'You chained open redirect with SSRF to access metadata!',
        };
      }

      return {
        success: true,
        profile: content,
        exploited: false,
        message: 'Profile fetched successfully',
      };
    } catch (error) {
      await this.prisma.userLabProgress.update({
        where: { id: progress.id },
        data: {
          attempts: { increment: 1 },
          lastAccess: new Date(),
        },
      });

      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch profile',
        hint: 'Try chaining: /redirect?url=http://169.254.169.254/...',
      };
    }
  }
}
