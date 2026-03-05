// src/modules/practice-labs/idor/labs/lab4/lab4.service.ts
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab4Service {
  // تتبع project roles (in-memory)
  private projectRoles = new Map<string, string>(); // userId → role

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    this.projectRoles.set(userId, 'reporter');
    return this.stateService.initializeState(userId, labId);
  }

  // ❌ الثغرة: IDOR — بدون project membership check
  async viewIssue(userId: string, labId: string, issueId: string) {
    if (!issueId) throw new BadRequestException('issueId is required');

    const issue = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, title: issueId },
    });

    if (!issue) {
      return {
        success: false,
        error: 'Issue not found',
        hint: 'Try ISS-301 through ISS-310',
      };
    }

    let issueData: any = {};
    try {
      issueData = JSON.parse(issue.body);
    } catch {}

    const isOwn = issueId === 'ISS-301';
    const isPrivate = issueData.isPrivate;

    return {
      success: true,
      exploited: isPrivate && !isOwn,
      issueId,
      issue: issueData,
      note: isPrivate
        ? `⚠️ You accessed a PRIVATE issue from Project ${issueData.project}. Now try updating it with sensitive fields.`
        : 'This is a public issue.',
    };
  }

  // ❌ الثغرة: Mass Assignment
  async updateIssue(
    userId: string,
    labId: string,
    issueId: string,
    body: Record<string, any>,
  ) {
    if (!issueId) throw new BadRequestException('issueId is required');

    const issue = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, title: issueId },
    });

    if (!issue) throw new BadRequestException('Issue not found');

    let issueData: any = {};
    try {
      issueData = JSON.parse(issue.body);
    } catch {}

    // ❌ الثغرة: mass assignment — يطبق كل الـ body fields
    const updatedIssue = { ...issueData, ...body };

    // تحقق من mass assignment للـ role
    if (body.projectRole === 'admin' || body.role === 'admin') {
      this.projectRoles.set(userId, 'admin');
    }

    await this.prisma.labGenericContent.update({
      where: { id: issue.id },
      data: { body: JSON.stringify(updatedIssue) },
    });

    const currentRole = this.projectRoles.get(userId) || 'reporter';
    const isEscalated = currentRole === 'admin';

    return {
      success: true,
      exploited: isEscalated,
      issueId,
      updatedFields: Object.keys(body),
      yourProjectRole: currentRole,
      ...(isEscalated && {
        message:
          '🎉 You escalated to project admin! Now access /project/settings to get the flag.',
      }),
    };
  }

  async getProjectSettings(userId: string, labId: string) {
    const currentRole = this.projectRoles.get(userId) || 'reporter';

    if (currentRole !== 'admin') {
      throw new ForbiddenException({
        error: 'Admin access required',
        yourRole: currentRole,
        hint: 'Escalate your role using mass assignment in the issue update endpoint.',
      });
    }

    return {
      success: true,
      exploited: true,
      projectSettings: {
        projectName: 'Project ALPHA',
        secretConfig: 'API_SECRET=prod_key_xyz789',
        adminCount: 1,
        webhookUrl: 'https://internal.bugflow.io/webhook/secret',
      },
      flag: 'FLAG{IDOR_MASS_ASSIGNMENT_CHAINED_PRIVILEGE_ESCALATION}',
      vulnerability: 'Chained: IDOR + Mass Assignment → Privilege Escalation',
      exploitChain: [
        '1. IDOR: Accessed private issues without project membership check',
        '2. Mass Assignment: Injected "projectRole: admin" into issue update body',
        '3. Server blindly applied all body fields including the role field',
        '4. Accessed admin-only project settings',
      ],
      fix: [
        'IDOR fix: Check project membership before returning issue data',
        'Mass Assignment fix: Use explicit field whitelisting instead of Object.assign()',
        'Example: const allowed = { title, description, priority }; update only these fields',
      ],
    };
  }
}
