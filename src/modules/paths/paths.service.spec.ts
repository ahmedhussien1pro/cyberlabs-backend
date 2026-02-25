import { Test, TestingModule } from '@nestjs/testing';
import { PathsService } from './paths.service';
import { PrismaService } from '../../core/database';

describe('PathsService', () => {
  let service: PathsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PathsService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            learningPath: {
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
            },
            pathEnrollment: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            enrollment: {
              findUnique: jest.fn(),
            },
            userLabProgress: {
              findUnique: jest.fn(),
            }
          },
        },
      ],
    }).compile();

    service = module.get<PathsService>(PathsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
