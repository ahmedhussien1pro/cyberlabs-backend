// src/modules/practice-labs/bl-vuln/labs/lab5/lab5.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab5Service {
  // تتبع طلبات الزيادة (in-memory)
  private raiseRequests = new Map<
    string,
    {
      requestId: string;
      userId: string;
      labId: string;
      currentSalary: number;
      requestedSalary: number;
      reason: string;
      status: string;
      requesterId: string;
      approverId: string;
      managerApproved: boolean;
    }
  >();

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async submitRaiseRequest(
    userId: string,
    labId: string,
    currentSalary: number,
    requestedSalary: number,
    reason: string,
  ) {
    if (!currentSalary || !requestedSalary) {
      throw new BadRequestException(
        'currentSalary and requestedSalary are required',
      );
    }
    if (requestedSalary <= currentSalary) {
      throw new BadRequestException(
        'requestedSalary must be higher than currentSalary',
      );
    }

    const requestId = `RAISE-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    // Manager هو الـ approver الافتراضي
    const defaultApproverId = `manager_${userId}`;

    this.raiseRequests.set(requestId, {
      requestId,
      userId,
      labId,
      currentSalary,
      requestedSalary,
      reason,
      status: 'PENDING',
      requesterId: userId,
      approverId: defaultApproverId,
      managerApproved: false,
    });

    return {
      success: true,
      requestId,
      status: 'PENDING',
      currentSalary,
      requestedSalary,
      raiseAmount: requestedSalary - currentSalary,
      approverId: defaultApproverId,
      message: 'Request submitted. Waiting for manager approval.',
      note: 'Your manager needs to approve this request. Or... can you change who the approver is?',
    };
  }

  // ❌ الثغرة: لا يتحقق من أن newApproverId ≠ requesterId
  async delegateApprover(
    userId: string,
    labId: string,
    requestId: string,
    newApproverId: string,
  ) {
    if (!requestId || !newApproverId) {
      throw new BadRequestException('requestId and newApproverId are required');
    }

    const request = this.raiseRequests.get(requestId);
    if (!request || request.userId !== userId) {
      throw new NotFoundException('Request not found');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Can only delegate pending requests');
    }

    // ❌ الثغرة: لا يتحقق من self-reference
    // if (newApproverId === request.requesterId) throw ForbiddenException ← مفقود!
    request.approverId = newApproverId;

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'HR_ACTION',
        action: 'DELEGATE_APPROVER',
        meta: {
          requestId,
          newApproverId,
          isSelfDelegation: newApproverId === userId,
        },
      },
    });

    return {
      success: true,
      requestId,
      newApproverId,
      isSelfDelegation: newApproverId === userId,
      message: `Approver changed to: ${newApproverId}`,
      warning:
        newApproverId === userId
          ? '⚠️ You just made yourself the approver of your own request! Now try /approve'
          : 'Approver updated successfully.',
    };
  }

  // ❌ الثغرة: لا يتحقق من self-approval
  async approveRequest(userId: string, labId: string, requestId: string) {
    if (!requestId) throw new BadRequestException('requestId is required');

    const request = this.raiseRequests.get(requestId);
    if (!request || request.userId !== userId) {
      throw new NotFoundException('Request not found');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Request already processed');
    }

    // ✅ يتحقق من أنك الـ approver
    if (request.approverId !== userId) {
      throw new ForbiddenException({
        error: 'Not authorized to approve',
        message: 'You are not the designated approver for this request',
        currentApprover: request.approverId,
        hint: 'Can you change the approver to yourself using the delegate endpoint?',
      });
    }

    // ❌ الثغرة: لا يتحقق من self-approval (requesterId === approverId)
    const isSelfApproval = request.requesterId === userId;

    request.status = 'APPROVED';
    request.managerApproved = true;

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: isSelfApproval ? 'EXPLOIT' : 'HR_ACTION',
        action: 'SALARY_RAISE_APPROVED',
        meta: {
          requestId,
          isSelfApproval,
          currentSalary: request.currentSalary,
          approvedSalary: request.requestedSalary,
          raiseAmount: request.requestedSalary - request.currentSalary,
        },
      },
    });

    if (isSelfApproval) {
      return {
        success: true,
        exploited: true,
        requestId,
        status: 'APPROVED',
        previousSalary: request.currentSalary,
        newSalary: request.requestedSalary,
        raiseAmount: request.requestedSalary - request.currentSalary,
        approvedBy: 'yourself (self-approval exploit)',
        flag: 'FLAG{BL_SELF_APPROVAL_HR_SALARY_RAISE_EXPLOITED}',
        vulnerability: 'Business Logic — Multi-Step Self-Approval Attack',
        exploitChain: [
          '1. Submitted salary raise request (you = requester)',
          '2. Used /delegate to change approverId to your own userId',
          '3. Called /approve — system saw you as approver and approved',
          '4. No check prevented self-approval',
        ],
        impact:
          'You approved your own salary raise without manager or HR consent. In a real system, this would cause unauthorized payroll changes and financial fraud.',
        fix: [
          'Check self-approval: if (request.requesterId === approverId) throw ForbiddenException',
          'In delegate: if (newApproverId === request.requesterId) throw ForbiddenException',
          'Require minimum 2 distinct approvers for financial requests',
          'Log and alert on self-delegation attempts',
        ],
      };
    }

    return {
      success: true,
      exploited: false,
      requestId,
      status: 'APPROVED',
      newSalary: request.requestedSalary,
    };
  }
}
