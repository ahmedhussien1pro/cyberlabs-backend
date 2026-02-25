import { Test, TestingModule } from '@nestjs/testing';
import { LabsService } from './labs.service';
import { PrismaService } from '../../../core/database';

describe('LabsService', () => {
  let service: LabsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LabsService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            lab: {
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
            },
            userLabProgress: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<LabsService>(LabsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
