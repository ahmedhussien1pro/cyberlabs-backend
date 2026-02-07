import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab1Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // API endpoint لجلب الوثائق
  async listDocuments(userId: string, labId: string) {
    const docs = await this.prisma.labGenericContent.findMany({
      where: { userId, labId },
      select: { id: true, title: true, author: true },
    });

    return { documents: docs };
  }

  // ❌ الثغرة: BOLA - يعتمد على documentId بدون التحقق من الملكية
  async getDocument(userId: string, labId: string, documentId: string) {
    const doc = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, id: documentId },
      // ❌ الثغرة: مافيش تحقق إن المستخدم الحالي هو صاحب الوثيقة!
    });

    if (!doc) throw new NotFoundException('Document not found');

    // التحقق من الاستغلال
    if (doc.author === 'premium' && doc.body.includes('FLAG')) {
      return {
        document: doc,
        exploited: true,
        flag: 'FLAG{API_BOLA_EXPLOITED}',
        message: 'BOLA vulnerability exploited! Accessed premium user document',
      };
    }

    return { document: doc };
  }

  // ❌ الثغرة: يسمح بتحديث أي وثيقة بناءً على ID
  async updateDocument(
    userId: string,
    labId: string,
    documentId: string,
    newTitle: string,
  ) {
    const doc = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, id: documentId },
    });

    if (!doc) throw new NotFoundException('Document not found');

    const updated = await this.prisma.labGenericContent.update({
      where: { id: doc.id },
      data: { title: newTitle },
    });

    return { success: true, document: updated };
  }

  // ❌ الثغرة: يسمح بحذف أي وثيقة بناءً على ID
  async deleteDocument(userId: string, labId: string, documentId: string) {
    const doc = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, id: documentId },
    });

    if (!doc) throw new NotFoundException('Document not found');

    await this.prisma.labGenericContent.delete({
      where: { id: doc.id },
    });

    return { success: true, message: 'Document deleted' };
  }
}
