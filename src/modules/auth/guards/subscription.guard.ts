// src/modules/auth/guards/subscription.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const { slug, courseId } = request.params;

    let course;
    if (slug) {
      course = await this.prisma.course.findUnique({ where: { slug } });
    } else if (courseId) {
      course = await this.prisma.course.findUnique({ where: { id: courseId } });
    }

    if (!course) throw new NotFoundException('Course not found');

    if (course.access === 'FREE') return true;

    if (!user)
      throw new ForbiddenException('Authentication required for paid courses');

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId: user.id,
        isActive: true,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
      include: { plan: true },
    });

    if (!subscription) {
      throw new ForbiddenException(
        `This course requires a ${course.access} subscription.`,
      );
    }

    if (course.access === 'PREMIUM' && subscription.plan.name !== 'PREMIUM') {
      throw new ForbiddenException(
        'Upgrade to PREMIUM required to access this course.',
      );
    }

    return true;
  }
}
