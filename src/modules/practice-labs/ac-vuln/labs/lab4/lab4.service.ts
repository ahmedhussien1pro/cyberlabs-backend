// src/modules/practice-labs/ac-vuln/labs/lab4/lab4.service.ts
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

/**
 * Lab 4 — "Multi-Step IDOR: Corporate Document Leak"
 *
 *   STEP_1 → List own documents via /documents/mine        → learns doc structure
 *   STEP_2 → Hit /documents/all → 403 but leaks docIds    → discovers target ID
 *   STEP_3 → Download DOC-CONF-2026-Q2 via /documents/download → full exploit → dynamic flag
 *
 * /submit requires NO flag input.
 */

const FLAG_PREFIX = 'FLAG{MULTISTEP_IDOR_DOCUMENT_LEAK';
const stepStore   = new Map<string, Set<string>>();
const key = (u: string, l: string) => `${u}:${l}`;

@Injectable()
export class Lab4Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    const result = await this.stateService.initializeState(userId, labId);
    stepStore.delete(key(userId, result.labId));
    return { status: 'success', message: 'DocuVault portal initialized' };
  }

  // STEP_1: safe endpoint — own documents
  async getMyDocuments(userId: string, labId: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const k = key(userId, resolvedLabId);
    if (!stepStore.has(k)) stepStore.set(k, new Set());
    const done = stepStore.get(k)!;

    const myDocs = await this.prisma.labGenericContent.findMany({
      where: { userId, labId: resolvedLabId, author: 'current_user' },
    });

    if (!done.has('STEP_1')) done.add('STEP_1');

    return {
      success: true,
      stepUnlocked: 'STEP_1',
      documents: myDocs.map((d) => ({ docId: d.title, description: d.body, downloadUrl: d.fileUrl })),
      note: 'Your documents. Notice each has a docId. Try listing ALL documents — there might be an /all endpoint.',
    };
  }

  // STEP_2: leaky 403 — reveals other doc IDs
  async getAllDocuments(userId: string, labId: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const k = key(userId, resolvedLabId);
    if (!stepStore.has(k)) stepStore.set(k, new Set());
    const done = stepStore.get(k)!;

    const allDocs = await this.prisma.labGenericContent.findMany({
      where: { userId, labId: resolvedLabId },
    });

    if (!done.has('STEP_2')) done.add('STEP_2');

    // ❌ Information disclosure: returns doc IDs in the 403 body
    throw new ForbiddenException({
      error: 'Access denied',
      message: 'You do not have permission to list all documents',
      stepUnlocked: 'STEP_2',
      hint: 'You found the IDs — try downloading one using POST /documents/download with a discovered docId.',
      metadata: {
        totalDocuments: allDocs.length,
        recentIds: allDocs.map((d) => d.title),
      },
    });
  }

  // STEP_3: ❌ IDOR — no ownership check on download
  async downloadDocument(userId: string, labId: string, docId: string) {
    if (!docId) throw new BadRequestException('docId is required');

    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const k = key(userId, resolvedLabId);
    if (!stepStore.has(k)) stepStore.set(k, new Set());
    const done = stepStore.get(k)!;

    const doc = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId: resolvedLabId, title: docId },
    });

    if (!doc) throw new NotFoundException('Document not found');

    let docContent: Record<string, unknown> = {};
    try { docContent = JSON.parse(doc.body); } catch { docContent = { description: doc.body }; }

    if (docId === 'DOC-CONF-2026-Q2') {
      done.add('STEP_1');
      done.add('STEP_2');
      done.add('STEP_3');
      return {
        success: true,
        exploited: true,
        docId,
        stepUnlocked: 'STEP_3',
        fileName: (docContent.fileName as string) || 'confidential.pdf',
        classification: docContent.classification,
        content: docContent,
        downloadUrl: doc.fileUrl,
        vulnerability: 'Multi-Step IDOR',
        exploitChain:
          '1. Enumerated document IDs via /documents/all metadata leak\n' +
          '2. Used discovered docId in /documents/download without authorization check',
        impact: 'You accessed TOP SECRET M&A documents. This could enable insider trading and cause massive legal damage.',
        note: 'All steps complete! Click "Get Your Flag" to claim your reward.',
      };
    }

    return {
      success: true,
      exploited: false,
      docId,
      content: docContent,
      downloadUrl: doc.fileUrl,
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
      message: 'You chained an information disclosure bug with an IDOR to access confidential corporate documents.',
      explanation:
        'Multi-step IDOR: first a leaky 403 exposed document IDs, then a missing ownership check allowed download. ' +
        'Fix: never leak resource IDs in error responses, and always verify ownership on every sensitive endpoint.',
    };
  }
}
