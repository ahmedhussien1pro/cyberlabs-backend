import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../../core/database';

const MOCK_NOTIF = {
  id: 'n1',
  userId: 'u1',
  type: 'SYSTEM',
  title: 'Test',
  isRead: false,
  isArchived: false,
};

const prismaMock = {
  notification: {
    findMany: jest.fn().mockResolvedValue([MOCK_NOTIF]),
    count: jest.fn().mockResolvedValue(1),
    findUnique: jest.fn().mockResolvedValue(MOCK_NOTIF),
    update: jest.fn().mockResolvedValue({ ...MOCK_NOTIF, isRead: true }),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    delete: jest.fn().mockResolvedValue(MOCK_NOTIF),
    create: jest.fn().mockResolvedValue(MOCK_NOTIF),
  },
  $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('returns inbox notifications with unreadCount', async () => {
      prismaMock.$transaction.mockResolvedValueOnce([[MOCK_NOTIF], 1, 1]);
      const result = await service.getNotifications('u1', {
        tab: 'inbox' as any,
        page: 1,
        limit: 20,
      });
      expect(result.unreadCount).toBe(1);
      expect(result.notifications).toHaveLength(1);
    });
  });

  describe('markAsRead', () => {
    it('marks notification as read', async () => {
      await service.markAsRead('u1', 'n1');
      expect(prismaMock.notification.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { isRead: true },
      });
    });

    it('throws ForbiddenException when userId mismatch', async () => {
      prismaMock.notification.findUnique.mockResolvedValueOnce({
        ...MOCK_NOTIF,
        userId: 'other-user',
      });
      await expect(service.markAsRead('u1', 'n1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when notification missing', async () => {
      prismaMock.notification.findUnique.mockResolvedValueOnce(null);
      await expect(service.markAsRead('u1', 'n1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllRead', () => {
    it('updates all unread notifications', async () => {
      prismaMock.notification.updateMany.mockResolvedValueOnce({ count: 3 });
      const result = await service.markAllRead('u1');
      expect(result.updated).toBe(3);
    });
  });

  describe('archive', () => {
    it('sets isArchived and isRead to true', async () => {
      await service.archive('u1', 'n1');
      expect(prismaMock.notification.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { isArchived: true, isRead: true },
      });
    });
  });

  describe('deleteOne', () => {
    it('deletes notification', async () => {
      await service.deleteOne('u1', 'n1');
      expect(prismaMock.notification.delete).toHaveBeenCalledWith({
        where: { id: 'n1' },
      });
    });
  });
});
