// src/modules/practice-labs/ac-vuln/labs/lab2/lab2.service.ts
import {
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

/**
 * Lab 2 — "Vertical Privilege Escalation via Role Header Injection"
 *
 *   STEP_1 → Call GET /orders as regular user             → sees own orders
 *   STEP_2 → Call POST /admin/users without header        → gets 403 + hint
 *   STEP_3 → Call POST /admin/users with X-User-Role:admin → full exploit → dynamic flag
 *
 * /submit requires NO flag input.
 */

const FLAG_PREFIX = 'FLAG{VERTICAL_PRIVESC_ROLE_HEADER';
const stepStore   = new Map<string, Set<string>>();
const key = (u: string, l: string) => `${u}:${l}`;

@Injectable()
export class Lab2Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    const result = await this.stateService.initializeState(userId, labId);
    stepStore.delete(key(userId, result.labId));
    return { status: 'success', message: 'ShopAdmin portal initialized' };
  }

  async getMyOrders(userId: string, labId: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const k = key(userId, resolvedLabId);
    if (!stepStore.has(k)) stepStore.set(k, new Set());
    const done = stepStore.get(k)!;

    const orders = await this.prisma.labGenericContent.findMany({
      where: { userId, labId: resolvedLabId, author: 'customer_john' },
    });

    if (!done.has('STEP_1')) done.add('STEP_1');

    return {
      success: true,
      stepUnlocked: 'STEP_1',
      orders: orders.map((o) => ({ orderId: o.title, details: o.body })),
      note: 'These are your orders. The admin panel at /admin/users is restricted — but how does the server know your role?',
    };
  }

  // ❌ VULN: trusts X-User-Role header from client
  async getAdminUsers(userId: string, labId: string, userRole?: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const k = key(userId, resolvedLabId);
    if (!stepStore.has(k)) stepStore.set(k, new Set());
    const done = stepStore.get(k)!;

    const effectiveRole = userRole || 'customer';

    if (effectiveRole !== 'admin') {
      if (!done.has('STEP_2')) done.add('STEP_2');
      throw new ForbiddenException({
        error: 'Access denied',
        message: 'Admin role required',
        yourRole: effectiveRole,
        stepUnlocked: 'STEP_2',
        hint: 'The server reads your role from the X-User-Role request header. What if you set it yourself?',
      });
    }

    // Exploit: header was forged to admin
    done.add('STEP_1');
    done.add('STEP_2');
    done.add('STEP_3');

    const allUsers = await this.prisma.labGenericUser.findMany({
      where: { userId, labId: resolvedLabId },
      select: { id: true, username: true, role: true, email: true },
    });
    const allOrders = await this.prisma.labGenericContent.findMany({
      where: { userId, labId: resolvedLabId },
    });

    return {
      success: true,
      exploited: true,
      stepUnlocked: 'STEP_3',
      users: allUsers,
      orders: allOrders.map((o) => ({ orderId: o.title, details: o.body, customer: o.author })),
      adminSecret: 'Admin dashboard unlocked via X-User-Role header injection',
      vulnerability: 'Vertical Privilege Escalation via Header Injection',
      impact: 'You gained admin access by manipulating the X-User-Role header and viewed all user accounts and orders.',
      note: 'All steps complete! Click "Get Your Flag" to claim your reward.',
    };
  }

  async getProgress(userId: string, labId: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const done = stepStore.get(key(userId, resolvedLabId)) ?? new Set<string>();
    return {
      completedSteps: [...done],
      allStepsDone: done.has('STEP_1') && done.has('STEP_2') && done.has('STEP_3'),
    };
  }

  async submitFlag(userId: string, labId: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const done = stepStore.get(key(userId, resolvedLabId)) ?? new Set<string>();

    if (!done.has('STEP_1') || !done.has('STEP_2') || !done.has('STEP_3'))
      throw new ForbiddenException('Complete all 3 steps before submitting');

    stepStore.delete(key(userId, resolvedLabId));
    const flag = this.stateService.generateDynamicFlag(FLAG_PREFIX, userId, resolvedLabId);

    return {
      success: true,
      flag,
      message: 'You exploited vertical privilege escalation by forging the X-User-Role header.',
      explanation:
        'Never trust role information from client-supplied headers. ' +
        'Always derive the user role from the verified JWT token payload on the server side.',
    };
  }
}
