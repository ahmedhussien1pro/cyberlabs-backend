import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database';
import { subDays, format } from 'date-fns';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /profile/achievements */
  async getAchievements(userId: string) {
    return this.prisma.userAchievement.findMany({
      where: { userId },
      take: 100,
      include: {
        achievement: {
          select: {
            title: true,
            ar_title: true,
            description: true,
            ar_description: true,
            iconUrl: true,
            category: true,
            xpReward: true,
          },
        },
      },
      orderBy: { achievedAt: 'desc' },
    });
  }

  /** GET /profile/skills */
  async getSkills(userId: string) {
    return this.prisma.userSkill.findMany({
      where: { userId },
      include: {
        skill: {
          select: {
            name: true,
            ar_name: true,
            category: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /** GET /profile/certificates */
  async getCertificates(userId: string) {
    return this.prisma.issuedCertificate.findMany({
      where: { userId, status: 'ACTIVE' },
      take: 100,
      include: {
        course: {
          select: { title: true, ar_title: true, thumbnail: true },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  /** GET /profile/activity */
  async getActivity(userId: string) {
    const since = subDays(new Date(), 30);
    const activities = await this.prisma.userActivity.findMany({
      where: { userId, date: { gte: since } },
      take: 60,
      orderBy: { date: 'desc' },
    });
    return activities.map((a) => ({
      ...a,
      date: format(a.date, 'yyyy-MM-dd'),
    }));
  }
}
