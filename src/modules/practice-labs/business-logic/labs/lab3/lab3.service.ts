// src/modules/practice-labs/bl-vuln/labs/lab3/lab3.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

const WORKFLOW_STEPS = [
  'submitted',
  'email-verified',
  'background-checked',
  'final-offer',
];

@Injectable()
export class Lab3Service {
  // تتبع الطلبات (in-memory)
  private applications = new Map<
    string,
    {
      userId: string;
      labId: string;
      jobTitle: string;
      currentStep: string;
      completedSteps: string[];
    }
  >();

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async applyForJob(
    userId: string,
    labId: string,
    jobTitle: string,
    resume: string,
  ) {
    if (!jobTitle) throw new BadRequestException('jobTitle is required');

    const applicationId = `APP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    this.applications.set(applicationId, {
      userId,
      labId,
      jobTitle,
      currentStep: 'submitted',
      completedSteps: ['submitted'],
    });

    return {
      success: true,
      applicationId,
      jobTitle,
      currentStep: 'submitted',
      workflow: WORKFLOW_STEPS,
      nextStep: 'email-verified',
      message: 'Application submitted! Next: complete email verification.',
    };
  }

  // ❌ الثغرة: لا يتحقق من تسلسل الخطوات
  async advanceStep(
    userId: string,
    labId: string,
    applicationId: string,
    step: string,
    data?: any,
  ) {
    const application = this.applications.get(applicationId);

    if (!application || application.userId !== userId) {
      throw new NotFoundException('Application not found');
    }

    if (!WORKFLOW_STEPS.includes(step)) {
      throw new BadRequestException(
        `Invalid step. Valid steps: ${WORKFLOW_STEPS.join(', ')}`,
      );
    }

    // ❌ الثغرة: لا يتحقق من أن الخطوات السابقة مكتملة
    const stepIndex = WORKFLOW_STEPS.indexOf(step);
    const expectedIndex = WORKFLOW_STEPS.indexOf(application.currentStep) + 1;
    const isSkipped = stepIndex > expectedIndex;

    application.currentStep = step;
    if (!application.completedSteps.includes(step)) {
      application.completedSteps.push(step);
    }

    // تسجيل
    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: isSkipped ? 'EXPLOIT' : 'WORKFLOW',
        action: `STEP_${step.toUpperCase().replace('-', '_')}`,
        meta: {
          applicationId,
          step,
          isSkipped,
          skippedSteps: isSkipped
            ? WORKFLOW_STEPS.slice(expectedIndex, stepIndex)
            : [],
        },
      },
    });

    if (step === 'final-offer') {
      return {
        success: true,
        exploited: isSkipped,
        applicationId,
        jobTitle: application.jobTitle,
        completedSteps: application.completedSteps,
        skippedSteps: isSkipped ? WORKFLOW_STEPS.slice(1, stepIndex) : [],
        offer: {
          position: application.jobTitle,
          salary: '$120,000/year',
          startDate: '2026-04-01',
          status: 'ACCEPTED',
        },
        ...(isSkipped && {
          flag: 'FLAG{BL_WORKFLOW_BYPASS_SKIP_VERIFICATION_HIRED}',
          vulnerability: 'Business Logic — Workflow Step Bypass',
          impact:
            'You bypassed email verification and background check to receive a job offer. In reality, this could allow unverified/malicious actors to gain employment.',
          fix:
            'Enforce sequential workflow server-side: ' +
            'const prevStep = WORKFLOW[stepIndex - 1]; ' +
            'if (!completedSteps.includes(prevStep)) throw new Error("Complete previous step first");',
        }),
      };
    }

    return {
      success: true,
      applicationId,
      currentStep: step,
      completedSteps: application.completedSteps,
      nextStep: WORKFLOW_STEPS[stepIndex + 1] || null,
      message: isSkipped
        ? `⚠️ You skipped steps! Current: ${step}. Try jumping to final-offer.`
        : `Step "${step}" completed. Next: ${WORKFLOW_STEPS[stepIndex + 1]}`,
    };
  }
}
