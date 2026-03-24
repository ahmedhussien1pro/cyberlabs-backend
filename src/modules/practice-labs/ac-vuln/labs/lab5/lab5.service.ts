// src/modules/practice-labs/ac-vuln/labs/lab5/lab5.service.ts
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

/**
 * Lab 5 — "HTTP Method Override: Admin Delete Bypass"
 *
 *   STEP_1 → GET /users/info?username=carlos         → profile visible
 *   STEP_2 → POST /users/action username=carlos (no override) → sees action endpoint
 *   STEP_3 → POST /users/action with X-HTTP-Method-Override: DELETE → deletes carlos → dynamic flag
 *
 * /submit requires NO flag input.
 */

const FLAG_PREFIX = 'FLAG{HTTP_METHOD_OVERRIDE_ADMIN_DELETE';
const stepStore   = new Map<string, Set<string>>();
const key = (u: string, l: string) => `${u}:${l}`;

@Injectable()
export class Lab5Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    const result = await this.stateService.initializeState(userId, labId);
    stepStore.delete(key(userId, result.labId));
    return { status: 'success', message: 'UserAdmin portal initialized' };
  }

  // STEP_1: public info endpoint
  async getUserInfo(userId: string, labId: string, username: string) {
    if (!username) throw new BadRequestException('username is required');

    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const k = key(userId, resolvedLabId);
    if (!stepStore.has(k)) stepStore.set(k, new Set());
    const done = stepStore.get(k)!;

    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId: resolvedLabId, username },
      select: { id: true, username: true, role: true, email: true },
    });

    if (!user) throw new NotFoundException('User not found');

    if (!done.has('STEP_1')) done.add('STEP_1');

    return {
      success: true,
      stepUnlocked: 'STEP_1',
      user,
      note: 'Profile found. Deleting users requires admin access via DELETE /users/delete — but there may be another way. Check POST /users/action.',
    };
  }

  // STEP_2 + STEP_3: ❌ VULN — accepts method override without re-authorization
  async userAction(
    userId: string,
    labId: string,
    username: string,
    methodOverride?: string,
  ) {
    if (!username) throw new BadRequestException('username is required');

    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const k = key(userId, resolvedLabId);
    if (!stepStore.has(k)) stepStore.set(k, new Set());
    const done = stepStore.get(k)!;

    // No method override: STEP_2 discovery
    if (!methodOverride || methodOverride.toUpperCase() !== 'DELETE') {
      if (!done.has('STEP_2')) done.add('STEP_2');
      return await this.getUserInfo(userId, resolvedLabId, username).catch(() => ({
        success: true,
        stepUnlocked: 'STEP_2',
        message: 'Action endpoint reached. This endpoint accepts X-HTTP-Method-Override header. What happens if you set it to DELETE?',
        hint: 'Try: POST /users/action with header X-HTTP-Method-Override: DELETE',
      }));
    }

    // Method override = DELETE: ❌ no admin check!
    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId: resolvedLabId, username },
    });

    if (!user) throw new NotFoundException('User not found');

    if (username === 'carlos') {
      await this.prisma.labGenericUser.delete({ where: { id: user.id } });
      await this.prisma.labGenericLog.create({
        data: {
          userId,
          labId: resolvedLabId,
          type: 'EXPLOIT',
          action: 'UNAUTHORIZED_DELETE',
          meta: { username, method: 'X-HTTP-Method-Override: DELETE', timestamp: new Date().toISOString() },
        },
      });

      done.add('STEP_1');
      done.add('STEP_2');
      done.add('STEP_3');

      return {
        success: true,
        exploited: true,
        stepUnlocked: 'STEP_3',
        message: `User ${username} deleted via method override`,
        vulnerability: 'HTTP Method Override + Authorization Bypass',
        exploitDetails:
          'You sent a POST request with X-HTTP-Method-Override: DELETE. ' +
          'The backend processed it as DELETE without checking admin authorization.',
        impact: 'You bypassed RBAC to delete a user account — potential data loss and service disruption.',
        note: 'All steps complete! Click "Get Your Flag" to claim your reward.',
      };
    }

    await this.prisma.labGenericUser.delete({ where: { id: user.id } });
    return {
      success: true,
      exploited: false,
      message: `User ${username} deleted (not the target). Try username: carlos`,
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
      message: 'You bypassed admin-only DELETE by forging the X-HTTP-Method-Override header on a POST request.',
      explanation:
        'HTTP method override headers (X-HTTP-Method-Override, X-Method-Override) must never bypass authorization checks. ' +
        'Fix: disable method override in production OR re-validate the user role after detecting an override.',
    };
  }
}
