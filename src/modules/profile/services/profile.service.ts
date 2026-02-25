import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database';
import { subDays, format } from 'date-fns';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getAchievements(userId: string) {
    return this.prisma.userAchievement.findMany({
      where: { userId },
      take: 100, // Hard limit to prevent data dumping
      include: {
        achievement: {
          select: {
            title: true,
            ar_title: true,
            description: true,
            iconUrl: true,
            category: true,
            xpReward: true,
          },
        },
      },
      orderBy: { achievedAt: 'desc' },
    });
  }

  async getCertificates(userId: string) {
    return this.prisma.issuedCertificate.findMany({
      where: { userId, status: 'ACTIVE' },
      take: 100, // Hard limit
      include: {
        course: {
          select: { title: true, ar_title: true, thumbnail: true },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async getActivity(userId: string) {
    const since = subDays(new Date(), 30);
    const activities = await this.prisma.userActivity.findMany({
      where: { userId, date: { gte: since } },
      take: 60, // Security limit (max 60 days if logic changes)
      orderBy: { date: 'desc' },
    });
    return activities.map((a) => ({
      ...a,
      date: format(a.date, 'yyyy-MM-dd'),
    }));
  }
}
