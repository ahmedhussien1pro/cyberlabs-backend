import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database';
import { CreateGoalDto, UpdateGoalDto } from '../dto';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(userId: string) {
    return this.prisma.goal.findMany({
      where: { userId, status: { not: 'ARCHIVED' } },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getById(userId: string, goalId: string) {
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException('Goal not found');
    if (goal.userId !== userId) throw new ForbiddenException('Access denied');
    return goal;
  }

  async create(userId: string, dto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: {
        userId,
        title: dto.title,
        ar_title: dto.ar_title,
        description: dto.description,
        targetValue: dto.targetValue ?? 1,
        frequency: dto.frequency ?? 'WEEKLY',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async update(userId: string, goalId: string, dto: UpdateGoalDto) {
    await this._assertOwnership(userId, goalId);
    const data: Record<string, unknown> = { ...dto };
    if (dto.dueDate) data.dueDate = new Date(dto.dueDate);
    if (dto.currentValue !== undefined && dto.targetValue !== undefined) {
      if (dto.currentValue >= dto.targetValue) data.status = 'COMPLETED';
    }
    return this.prisma.goal.update({ where: { id: goalId }, data });
  }

  async delete(userId: string, goalId: string) {
    await this._assertOwnership(userId, goalId);
    await this.prisma.goal.delete({ where: { id: goalId } });
    return { success: true };
  }

  private async _assertOwnership(userId: string, goalId: string) {
    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
      select: { userId: true },
    });
    if (!goal) throw new NotFoundException('Goal not found');
    if (goal.userId !== userId) throw new ForbiddenException('Access denied');
    return goal;
  }
}
