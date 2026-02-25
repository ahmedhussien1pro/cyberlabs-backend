import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../../core/database';

const prismaMock = {
  userStats: {
    findUnique: jest.fn().mockResolvedValue({
      completedLabs: 5,
      totalHours: 10,
      currentStreak: 3,
      longestStreak: 7,
      activeDays: 20,
      completedCourses: 2,
      badgesCount: 4,
    }),
  },
  userPoints: {
    findUnique: jest
      .fn()
      .mockResolvedValue({ totalXP: 1200, totalPoints: 900, level: 3 }),
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(5), // ← FIX
  },
  userActivity: { findMany: jest.fn().mockResolvedValue([]) },
  enrollment: { findMany: jest.fn().mockResolvedValue([]) },
  userLabProgress: { findMany: jest.fn().mockResolvedValue([]) },
  xPLog: { findMany: jest.fn().mockResolvedValue([]) },
  user: {
    findUnique: jest.fn().mockResolvedValue({ name: 'Current User', avatarUrl: null })
  },
  $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  // ── getStats ─────────────────────────────────────────────────────
  describe('getStats', () => {
    it('returns merged stats + points', async () => {
      prismaMock.$transaction.mockResolvedValueOnce([
        {
          completedLabs: 5,
          totalHours: 10,
          currentStreak: 3,
          longestStreak: 7,
          activeDays: 20,
          completedCourses: 2,
          badgesCount: 4,
        },
        { totalXP: 1200, totalPoints: 900, level: 3 },
      ]);
      const result = await service.getStats('u1');
      expect(result.totalXP).toBe(1200);
      expect(result.completedLabs).toBe(5);
      expect(result.level).toBe(3);
    });

    it('returns zeros when DB records are null', async () => {
      prismaMock.$transaction.mockResolvedValueOnce([null, null]);
      const result = await service.getStats('u1');
      expect(result.totalXP).toBe(0);
      expect(result.level).toBe(1);
      expect(result.completedLabs).toBe(0);
    });
  });

  // ── getProgressChart ──────────────────────────────────────────────
  describe('getProgressChart', () => {
    it('returns 31 data points (today + 30 days)', async () => {
      prismaMock.xPLog.findMany.mockResolvedValueOnce([]);
      const result = await service.getProgressChart('u1');
      expect(result).toHaveLength(31);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('xp', 0);
    });

    it('sums XP correctly for same day', async () => {
      const today = new Date().toISOString().slice(0, 10);
      prismaMock.xPLog.findMany.mockResolvedValueOnce([
        { amount: 50, createdAt: new Date(`${today}T10:00:00Z`) },
        { amount: 30, createdAt: new Date(`${today}T15:00:00Z`) },
      ]);
      const result = await service.getProgressChart('u1');
      const todayEntry = result.find((r) => r.date === today);
      expect(todayEntry?.xp).toBe(80);
    });
  });

  // ── getLeaderboard ────────────────────────────────────────────────
  describe('getLeaderboard', () => {
    it('returns current user rank when not in top 10', async () => {
      prismaMock.userPoints.findMany.mockResolvedValueOnce([]);
      prismaMock.$transaction.mockResolvedValueOnce([
        { userId: 'u1', totalXP: 50, level: 1 },
        { name: 'MyName', avatarUrl: null }
      ]);
      prismaMock.userPoints.count.mockResolvedValueOnce(5); // 5 users > him → rank 6

      const result = await service.getLeaderboard('u1');
      const me = result.find((e) => e.isCurrentUser);
      expect(me).toBeDefined();
      expect(me?.rank).toBe(6);
    });

    it('marks current user in top 10 as isCurrentUser', async () => {
      prismaMock.userPoints.findMany.mockResolvedValueOnce([
        {
          userId: 'u1',
          totalXP: 5000,
          level: 10,
          user: { id: 'u1', name: 'Ahmed', avatarUrl: null },
        },
      ]);
      const result = await service.getLeaderboard('u1');
      expect(result[0].isCurrentUser).toBe(true);
    });
  });

  // ── getHeatmap ────────────────────────────────────────────────────
  describe('getHeatmap', () => {
    it('formats date as yyyy-MM-dd string', async () => {
      prismaMock.userActivity.findMany.mockResolvedValueOnce([
        {
          date: new Date('2026-02-01'),
          activeMinutes: 30,
          completedTasks: 3,
          labsSolved: 1,
        },
      ]);
      const result = await service.getHeatmap('u1');
      expect(result[0].date).toBe('2026-02-01');
      expect(result[0].count).toBe(4); // 3 tasks + 1 lab
    });
  });
});
