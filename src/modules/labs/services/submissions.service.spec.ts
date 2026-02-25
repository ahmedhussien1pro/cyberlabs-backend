import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionsService } from './submissions.service';
import { PrismaService } from '../../../core/database';

describe('SubmissionsService', () => {
  let service: SubmissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionsService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            lab: {
              findUnique: jest.fn(),
            },
            userLabProgress: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            labSubmission: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
            userPoints: {
              upsert: jest.fn(),
              update: jest.fn(),
            },
            pointsHistory: {
              create: jest.fn(),
            },
            xPLog: {
              create: jest.fn(),
            },
            userStats: {
              upsert: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SubmissionsService>(SubmissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
