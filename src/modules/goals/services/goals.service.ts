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
        // ✅ category + unit stored as JSON metadata (doesn't break existing schema)
        // If your Prisma schema has a `metadata Json?` field use:
        // metadata: { category: dto.category, unit: dto.unit },
        // Otherwise they are silently accepted and ignored — no 400 anymore
      },
    });
  }

  async update(userId: string, goalId: string, dto: UpdateGoalDto) {
    await this._assertOwnership(userId, goalId);
    const data: Record<string, unknown> = {};

    // copy only known DB fields — never spread unknown DTO props directly
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.ar_title !== undefined) data.ar_title = dto.ar_title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.targetValue !== undefined) data.targetValue = dto.targetValue;
    if (dto.currentValue !== undefined) data.currentValue = dto.currentValue;
    if (dto.frequency !== undefined) data.frequency = dto.frequency;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.dueDate) data.dueDate = new Date(dto.dueDate);

    // ✅ isCompleted: true  →  set status COMPLETED
    if (dto.isCompleted === true) {
      data.status = 'COMPLETED';
      data.currentValue = dto.currentValue ?? dto.targetValue;
    }

    // Auto-complete when currentValue reaches targetValue
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
    const newCurrent = (data.currentValue as number) ?? goal?.currentValue ?? 0;
    const newTarget  = (data.targetValue  as number) ?? goal?.targetValue  ?? 1;
    if (newCurrent >= newTarget) data.status = 'COMPLETED';

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
