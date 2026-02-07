import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import axios from 'axios';

@Injectable()
export class Lab1Service {
  private readonly FLAG = 'FLAG{SSRF_4DM1N_P4N3L_4CC3SS}';
  private readonly INTERNAL_URLS = [
    'http://localhost',
    'http://127.0.0.1',
    'http://169.254.169.254',
    'http://0.0.0.0',
    'http://[::1]',
  ];

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
      hint: 'Try accessing internal services using localhost or 127.0.0.1',
    };
  }

  /**
   * ⚠️ VULNERABLE: Fetch any URL without validation
   */
  async fetchUrl(userId: string, labId: string, url: string) {
    if (!url) {
      throw new BadRequestException('URL is required');
    }

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
      // ⚠️ VULNERABILITY: No URL validation - allows SSRF
      const response = await axios.get(url, {
        timeout: 5000,
        maxRedirects: 0,
        validateStatus: (status) => status < 500,
      });

      const content =
        typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data);

      // Track attempt
      await this.prisma.userLabProgress.update({
        where: { id: progress.id },
        data: {
          attempts: { increment: 1 },
          lastAccess: new Date(),
        },
      });

      // Check if flag was accessed
      const flagPattern = new RegExp(this.FLAG);
      const flagFound = flagPattern.test(content);

      // Check if internal service was accessed
      const isInternalAccess = this.INTERNAL_URLS.some((internalUrl) =>
        url.toLowerCase().startsWith(internalUrl),
      );

      if (flagFound && isInternalAccess) {
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
            code: url,
          },
        });

        return {
          success: true,
          content,
          exploited: true,
          flag: this.FLAG,
          message:
            '🎉 SSRF exploitation successful! You accessed internal services!',
          hint: 'You successfully exploited Server-Side Request Forgery!',
        };
      }

      return {
        success: true,
        content,
        exploited: false,
        isInternal: isInternalAccess,
        message: isInternalAccess
          ? 'Internal service accessed! Keep looking for sensitive data.'
          : 'External URL fetched successfully.',
        hint: 'Try accessing internal services like http://localhost:8080/admin',
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
        message: 'Failed to fetch URL',
        hint: 'Check the URL format. Try http://localhost or http://127.0.0.1',
      };
    }
  }

  /**
   * ⚠️ VULNERABLE: Check stock via SSRF
   */
  async checkStockAvailability(
    userId: string,
    labId: string,
    productUrl: string,
  ) {
    if (!productUrl) {
      throw new BadRequestException('Product URL is required');
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
      // ⚠️ VULNERABILITY: SSRF via stock check API
      const response = await axios.get(productUrl, {
        timeout: 5000,
      });

      const stockData = response.data;

      // Track attempt
      await this.prisma.userLabProgress.update({
        where: { id: progress.id },
        data: {
          attempts: { increment: 1 },
          lastAccess: new Date(),
        },
      });

      return {
        success: true,
        stock: stockData,
        message: 'Stock checked successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to check stock',
      };
    }
  }
}
