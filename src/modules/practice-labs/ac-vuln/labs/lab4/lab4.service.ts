// src/modules/practice-labs/ac-vuln/labs/lab4/lab4.service.ts
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab4Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ✅ Safe: يعرض فقط documents المستخدم الحالي
  async getMyDocuments(userId: string, labId: string) {
    const myDocs = await this.prisma.labGenericContent.findMany({
      where: {
        userId,
        labId,
        author: 'current_user',
      },
    });

    return {
      success: true,
      documents: myDocs.map((d) => ({
        docId: d.title,
        description: d.body,
        downloadUrl: d.fileUrl,
      })),
    };
  }

  // ⚠️ Leaky endpoint: يرجع 403 لكن يسرّب document IDs في الـ metadata
  async getAllDocuments(userId: string, labId: string) {
    const allDocs = await this.prisma.labGenericContent.findMany({
      where: { userId, labId },
    });

    // يرجع 403 لكن يسرّب IDs
    throw new ForbiddenException({
      error: 'Access denied',
      message: 'You do not have permission to list all documents',
      hint: 'This endpoint is for admins only',
      // ❌ Metadata leak:
      metadata: {
        totalDocuments: allDocs.length,
        recentIds: allDocs.map((d) => d.title),
      },
    });
  }

  // ❌ الثغرة: Multi-step IDOR — يحمّل document بناءً على docId بدون ownership check
  async downloadDocument(userId: string, labId: string, docId: string) {
    if (!docId) {
      throw new BadRequestException('docId is required');
    }

    // ❌ لا يوجد check: هل المستخدم يملك هذا الـ document؟
    const doc = await this.prisma.labGenericContent.findFirst({
      where: {
        userId,
        labId,
        title: docId,
      },
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    let docContent: any = {};
    try {
      docContent = JSON.parse(doc.body);
    } catch {
      docContent = { description: doc.body };
    }

    // تحقق من الوصول إلى confidential document
    const isConfidential = docId === 'DOC-CONF-2026-Q2';

    if (isConfidential) {
      return {
        success: true,
        exploited: true,
        docId,
        fileName: docContent.fileName || 'confidential.pdf',
        classification: docContent.classification,
        content: docContent,
        downloadUrl: doc.fileUrl,
        flag: 'FLAG{MULTISTEP_IDOR_DOCUMENT_LEAK_M&A_2026}',
        vulnerability: 'Multi-Step IDOR',
        exploitChain:
          '1. Enumerated document IDs via /documents/all metadata leak\n' +
          '2. Used discovered docId in /documents/download without authorization check',
        impact:
          'You accessed TOP SECRET M&A documents. This could lead to insider trading and massive financial/legal damage.',
        fix:
          'Always verify document ownership in download endpoint: ' +
          'WHERE docId = ? AND (owner = userId OR userId IN (SELECT userId FROM permissions WHERE docId = ?))',
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
}
