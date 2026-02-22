import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { PrismaService } from '../../../core/database';

const prismaMock = {
  userAchievement: {
    findMany: jest
      .fn()
      .mockResolvedValue([
        {
          achievementId: 'a1',
          achievement: {
            title: 'First Blood',
            category: 'LEARNING',
            xpReward: 100,
          },
        },
      ]),
  },
  issuedCertificate: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  userActivity: {
    findMany: jest
      .fn()
      .mockResolvedValue([
        {
          date: new Date('2026-02-01'),
          activeMinutes: 45,
          completedTasks: 2,
          labsSolved: 1,
        },
      ]),
  },
};

describe('ProfileService', () => {
  let service: ProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get<ProfileService>(ProfileService);
    jest.clearAllMocks();
  });

  it('getAchievements returns user achievements', async () => {
    const result = await service.getAchievements('u1');
    expect(result[0].achievement.title).toBe('First Blood');
  });

  it('getCertificates returns only ACTIVE certs', async () => {
    await service.getCertificates('u1');
    expect(prismaMock.issuedCertificate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'ACTIVE' }),
      }),
    );
  });

  it('getActivity formats dates as yyyy-MM-dd strings', async () => {
    const result = await service.getActivity('u1');
    expect(result[0].date).toBe('2026-02-01');
  });
});
