import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database';

@Injectable()
export class LabInstanceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get or create user's lab instance
   */
  async getOrCreateInstance(userId: string, labId: string) {
    // Check if instance exists
    let instance = await this.prisma.labInstance.findUnique({
      where: {
        userId_labId: {
          userId,
          labId,
        },
      },
    });

    // Create new instance if not exists
    if (!instance) {
      // Get lab default state
      const lab = await this.prisma.lab.findUnique({
        where: { id: labId },
        select: {
          id: true,
          initialState: true, // Add this field to Lab model
        },
      });

      if (!lab) {
        throw new NotFoundException('Lab not found');
      }

      instance = await this.prisma.labInstance.create({
        data: {
          userId,
          labId,
          state: lab.initialState || {}, // Default state from lab config
          balance: 5000, // Default balance
          isActive: true,
        },
      });
    }

    return instance;
  }

  /**
   * Update instance state
   */
  async updateInstanceState(
    userId: string,
    labId: string,
    updates: Partial<{ state: any; balance: number }>,
  ) {
    const instance = await this.prisma.labInstance.update({
      where: {
        userId_labId: {
          userId,
          labId,
        },
      },
      data: updates,
    });

    return instance;
  }

  /**
   * Reset user's lab instance
   */
  async resetInstance(userId: string, labId: string) {
    const lab = await this.prisma.lab.findUnique({
      where: { id: labId },
      select: { initialState: true },
    });

    const instance = await this.prisma.labInstance.update({
      where: {
        userId_labId: {
          userId,
          labId,
        },
      },
      data: {
        state: lab?.initialState || {},
        balance: 5000,
        isActive: true,
        startedAt: new Date(),
      },
    });

    return instance;
  }

  /**
   * Get instance state
   */
  async getInstanceState(userId: string, labId: string) {
    const instance = await this.getOrCreateInstance(userId, labId);
    return {
      state: instance.state,
      balance: instance.balance,
      startedAt: instance.startedAt,
    };
  }
}
