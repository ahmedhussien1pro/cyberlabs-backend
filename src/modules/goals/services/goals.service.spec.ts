import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { PrismaService } from '../../../core/database';

const MOCK_GOAL = {
  id: 'g1',
  userId: 'u1',
  title: 'Study 1 hour',
  targetValue: 7,
  currentValue: 0,
  status: 'ACTIVE',
  frequency: 'WEEKLY',
};

const prismaMock = {
  goal: {
    findMany: jest.fn().mockResolvedValue([MOCK_GOAL]),
    findUnique: jest.fn().mockResolvedValue(MOCK_GOAL),
    create: jest.fn().mockResolvedValue(MOCK_GOAL),
    update: jest.fn().mockResolvedValue(MOCK_GOAL),
    delete: jest.fn().mockResolvedValue(MOCK_GOAL),
  },
};

describe('GoalsService', () => {
  let service: GoalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get<GoalsService>(GoalsService);
    jest.clearAllMocks();
  });

  it('getAll returns goals for user', async () => {
    const result = await service.getAll('u1');
    expect(result).toEqual([MOCK_GOAL]);
  });

  it('create creates a goal', async () => {
    const result = await service.create('u1', {
      title: 'Study 1 hour',
      targetValue: 7,
      frequency: 'WEEKLY' as any,
    });
    expect(prismaMock.goal.create).toHaveBeenCalled();
    expect(result).toEqual(MOCK_GOAL);
  });

  it('update throws NotFoundException for unknown goal', async () => {
    prismaMock.goal.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.update('u1', 'bad-id', { title: 'x' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('update throws ForbiddenException for wrong user', async () => {
    prismaMock.goal.findUnique.mockResolvedValueOnce({
      ...MOCK_GOAL,
      userId: 'other',
    });
    await expect(service.update('u1', 'g1', { title: 'x' })).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('delete removes the goal', async () => {
    await service.delete('u1', 'g1');
    expect(prismaMock.goal.delete).toHaveBeenCalledWith({
      where: { id: 'g1' },
    });
  });

  it('auto-completes when currentValue >= targetValue', async () => {
    prismaMock.goal.findUnique.mockResolvedValueOnce(MOCK_GOAL);
    await service.update('u1', 'g1', { currentValue: 7, targetValue: 7 });
    expect(prismaMock.goal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'COMPLETED' }),
      }),
    );
  });
});
