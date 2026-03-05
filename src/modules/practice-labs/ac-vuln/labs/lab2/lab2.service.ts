// src/modules/practice-labs/ac-vuln/labs/lab2/lab2.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab2Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ❌ الثغرة: يقرأ userRole من HTTP header بدلاً من JWT token
  async getAdminUsers(userId: string, labId: string, userRole?: string) {
    const effectiveRole = userRole || 'customer';

    // ❌ الثغرة: الاعتماد على client-supplied header بدلاً من التحقق من الـ JWT
    if (effectiveRole !== 'admin') {
      throw new ForbiddenException({
        error: 'Access denied',
        message: 'Admin role required to access this endpoint',
        yourRole: effectiveRole,
        hint: 'How does the server know your role? Check the request headers.',
      });
    }

    // إذا وصل هنا، معناها effectiveRole === 'admin'
    const allUsers = await this.prisma.labGenericUser.findMany({
      where: { userId, labId },
      select: {
        id: true,
        username: true,
        role: true,
        email: true,
      },
    });

    const allOrders = await this.prisma.labGenericContent.findMany({
      where: { userId, labId },
    });

    // تحقق من أن المستخدم حقق الثغرة (وصل للـ admin panel باستخدام header مزيّف)
    const isExploited = userRole === 'admin';

    if (isExploited) {
      return {
        success: true,
        exploited: true,
        users: allUsers,
        orders: allOrders.map((o) => ({
          orderId: o.title,
          details: o.body,
          customer: o.author,
        })),
        adminSecret:
          'Admin dashboard unlocked via X-User-Role header injection',
        flag: 'FLAG{VERTICAL_PRIVESC_ROLE_HEADER_BYPASS_X42}',
        vulnerability: 'Vertical Privilege Escalation via Header Injection',
        impact:
          'You gained admin access by manipulating the X-User-Role header. ' +
          'This allowed you to view all user accounts and orders.',
        fix:
          'Never trust client-supplied role information. ' +
          'Always derive the user role from the authenticated JWT token payload: ' +
          'const userRole = req.user.role (from verified JWT).',
      };
    }

    return {
      success: true,
      exploited: false,
      users: allUsers,
      orders: allOrders.map((o) => ({ orderId: o.title, customer: o.author })),
    };
  }

  async getMyOrders(userId: string, labId: string) {
    const orders = await this.prisma.labGenericContent.findMany({
      where: {
        userId,
        labId,
        author: 'customer_john', // الفرضية: المستخدم الحالي هو customer_john
      },
    });

    return {
      success: true,
      orders: orders.map((o) => ({
        orderId: o.title,
        details: o.body,
      })),
    };
  }
}
