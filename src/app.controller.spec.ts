import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './core/database';
import { LoggerService } from './core/logger';
import { HashingService } from './core/security/hashing.service';
import { EncryptionService } from './core/security/encryption.service';

const prismaMock = { $queryRaw: jest.fn().mockResolvedValue([1]) };
const loggerMock = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  http: jest.fn(),
};
const hashingMock = {
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn().mockResolvedValue(true),
};
const encryptionMock = {
  encrypt: jest.fn().mockReturnValue('enc'),
  decrypt: jest.fn().mockReturnValue('dec'),
};

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: LoggerService, useValue: loggerMock },
        { provide: HashingService, useValue: hashingMock },
        { provide: EncryptionService, useValue: encryptionMock },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    jest.clearAllMocks();
  });

  it('should return "Hello World!"', () => {
    expect(appController.getHello()).toBe('Hello World!');
  });

  it('healthCheck returns ok when DB connected', async () => {
    const result = await appController.healthCheck();
    expect(result.status).toBe('ok');
  });

  it('healthCheck returns error when DB throws', async () => {
    prismaMock.$queryRaw.mockRejectedValueOnce(new Error('DB down'));
    const result = await appController.healthCheck();
    expect(result.status).toBe('error');
  });
});
