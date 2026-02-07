import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database';

@Injectable()
export class LabValidationService {
  constructor(private prisma: PrismaService) {}

  // التحقق من الـ Flag
  async validateFlag(labId: string, submittedFlag: string): Promise<boolean> {
    const lab = await this.prisma.lab.findUnique({
      where: { id: labId },
      select: { flagAnswer: true },
    });
    return lab?.flagAnswer === submittedFlag;
  }

  // تحقق مخصص (مثل: هل رصيد البنك أصبح صفر؟)
  async checkBusinessLogic(
    userId: string,
    labId: string,
    condition: (data: any) => boolean,
  ): Promise<boolean> {
    // يمكن استخدامه للتحقق من شروط معينة في الجداول الـ Generic
    return true; // سيتم تخصيصه لاحقاً لكل لاب
  }
}
