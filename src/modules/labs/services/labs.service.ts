import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database';
import { LabQueryDto, StartLabDto } from '../dto';
import {
  LabSerializer,
  LabProgressSerializer,
  LeaderboardEntrySerializer,
} from '../serializers';
import { plainToClass } from 'class-transformer';

@Injectable()
export class LabsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all labs with pagination and filters
   */
  async getAllLabs(query: LabQueryDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      difficulty,
      courseId,
      search,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isPublished: true,
    };

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (courseId) {
      where.courseId = courseId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get labs
    const labs = await this.prisma.lab.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        title: true,
        ar_title: true,
        description: true,
        ar_description: true,
        difficulty: true,
        duration: true,
        labUrl: true,
        xpReward: true,
        pointsReward: true,
        maxAttempts: true,
        timeLimit: true,
        isPublished: true,
        courseId: true,
        // Don't expose flagAnswer
      },
    });

    const total = await this.prisma.lab.count({ where });

    const data = labs.map((lab) =>
      plainToClass(LabSerializer, lab, { excludeExtraneousValues: true }),
    );

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get lab by ID
   */
  async getLabById(labId: string): Promise<LabSerializer> {
    const lab = await this.prisma.lab.findUnique({
      where: { id: labId },
      select: {
        id: true,
        title: true,
        ar_title: true,
        description: true,
        ar_description: true,
        difficulty: true,
        duration: true,
        labUrl: true,
        xpReward: true,
        pointsReward: true,
        maxAttempts: true,
        timeLimit: true,
        isPublished: true,
        courseId: true,
        steps: true,
        // Don't expose flagAnswer
      },
    });

    if (!lab) {
      throw new NotFoundException('Lab not found');
    }

    if (!lab.isPublished) {
      throw new BadRequestException('Lab is not published yet');
    }

    return plainToClass(LabSerializer, lab, { excludeExtraneousValues: true });
  }

  /**
   * Start a lab (create progress)
   */
  async startLab(
    userId: string,
    startDto: StartLabDto,
  ): Promise<LabProgressSerializer> {
    const { labId } = startDto;

    // Check if lab exists
    const lab = await this.prisma.lab.findUnique({
      where: { id: labId },
      select: {
        id: true,
        title: true,
        ar_title: true,
        difficulty: true,
        pointsReward: true,
        xpReward: true,
        isPublished: true,
      },
    });

    if (!lab) {
      throw new NotFoundException('Lab not found');
    }

    if (!lab.isPublished) {
      throw new BadRequestException('Lab is not published yet');
    }

    // Check if already started
    const existingProgress = await this.prisma.userLabProgress.findUnique({
      where: {
        userId_labId: {
          userId,
          labId,
        },
      },
    });

    if (existingProgress) {
      // Return existing progress
      const progress = await this.prisma.userLabProgress.findUnique({
        where: {
          userId_labId: {
            userId,
            labId,
          },
        },
        include: {
          lab: {
            select: {
              id: true,
              title: true,
              ar_title: true,
              difficulty: true,
              pointsReward: true,
              xpReward: true,
            },
          },
        },
      });

      return plainToClass(LabProgressSerializer, progress, {
        excludeExtraneousValues: true,
      });
    }

    // Create new progress
    const progress = await this.prisma.userLabProgress.create({
      data: {
        userId,
        labId,
        progress: 0,
        attempts: 0,
        hintsUsed: 0,
        flagSubmitted: false,
        startedAt: new Date(),
        lastAccess: new Date(),
      },
      include: {
        lab: {
          select: {
            id: true,
            title: true,
            ar_title: true,
            difficulty: true,
            pointsReward: true,
            xpReward: true,
          },
        },
      },
    });

    return plainToClass(LabProgressSerializer, progress, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get user's lab progress
   */
  async getLabProgress(
    userId: string,
    labId: string,
  ): Promise<LabProgressSerializer> {
    const progress = await this.prisma.userLabProgress.findUnique({
      where: {
        userId_labId: {
          userId,
          labId,
        },
      },
      include: {
        lab: {
          select: {
            id: true,
            title: true,
            ar_title: true,
            difficulty: true,
            pointsReward: true,
            xpReward: true,
          },
        },
      },
    });

    if (!progress) {
      throw new NotFoundException(
        'Lab progress not found. Start the lab first.',
      );
    }

    return plainToClass(LabProgressSerializer, progress, {
      excludeExtraneousValues: true,
    });
  }

   /**
   * Get all user's lab progress
   */
  async getMyLabsProgress(userId: string) {
    const labProgress = await this.prisma.userLabProgress.findMany({
      where: { userId },
      include: {
        lab: {
          select: {
            id: true,
            title: true,
            ar_title: true,
            difficulty: true,
            pointsReward: true,
            xpReward: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    // ✅ Fixed: use completedAt instead of isCompleted
    return labProgress.map((progress) => ({
      labId: progress.labId,
      lab: progress.lab,
      isCompleted: !!progress.completedAt, // ← Convert date to boolean
      attempts: progress.attempts,
      hintsUsed: progress.hintsUsed,
      startedAt: progress.startedAt,
      completedAt: progress.completedAt,
      progress: progress.progress,
    }));
  }


  /**
   * Get leaderboard (top users by points)
   */
  async getLeaderboard(
    limit: number = 10,
  ): Promise<LeaderboardEntrySerializer[]> {
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        points: {
          select: {
            totalPoints: true,
            totalXP: true,
            level: true,
          },
        },
        labProgress: {
          where: {
            completedAt: { not: null },
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        points: {
          totalPoints: 'desc',
        },
      },
      take: limit,
    });

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      userName: user.name,
      avatarUrl: user.avatarUrl,
      totalPoints: user.points?.totalPoints || 0,
      totalXP: user.points?.totalXP || 0,
      completedLabs: user.labProgress.length,
      level: user.points?.level || 1,
    }));

    return leaderboard.map((entry) =>
      plainToClass(LeaderboardEntrySerializer, entry, {
        excludeExtraneousValues: true,
      }),
    );
  }
}
