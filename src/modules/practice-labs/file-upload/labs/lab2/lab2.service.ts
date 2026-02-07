import { Injectable, BadRequestException } from '@nestjs/common';
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

  // ❌ الثغرة: يعتمد على MIME type من الـ client
  async uploadWithMimeCheck(
    userId: string,
    labId: string,
    fileName: string,
    mimeType: string,
    fileContent: string,
  ) {
    // ❌ الثغرة 1: يثق في MIME type من الـ request header
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];

    if (!allowedMimes.includes(mimeType)) {
      throw new BadRequestException('Only images allowed');
    }

    // ❌ الثغرة 2: مابيتحققش من الـ magic bytes الفعلية
    // المفروض يقرأ أول bytes من الملف ويتحقق من signature

    const file = await this.prisma.labGenericContent.create({
      data: {
        userId,
        labId,
        title: fileName,
        body: fileContent,
        isPublic: true,
      },
    });

    // التحقق من الاستغلال
    const hasScriptContent =
      fileContent.includes('<script>') ||
      fileContent.includes('<?php') ||
      fileContent.includes('eval(');

    if (hasScriptContent && allowedMimes.includes(mimeType)) {
      return {
        success: true,
        file,
        exploited: true,
        flag: 'FLAG{MIME_TYPE_SPOOFED}',
        warning: 'MIME type spoofed! Malicious content uploaded as image',
        message: 'File uploaded successfully',
      };
    }

    return { success: true, file, message: 'File uploaded' };
  }

  // ❌ الثغرة: Content validation ضعيف
  async uploadWithContentCheck(
    userId: string,
    labId: string,
    fileName: string,
    fileContent: string,
  ) {
    // ❌ الثغرة: يتحقق من magic bytes بشكل سطحي
    // يكفي الملف يبدأ بـ magic bytes للصورة وباقيه malicious code

    const imageHeaders = {
      jpeg: 'FFD8FF',
      png: '89504E47',
      gif: '474946',
    };

    // تحويل أول 3 bytes للـ hex
    const firstBytes = fileContent.substring(0, 6);

    const isValidImage = Object.values(imageHeaders).some((header) =>
      firstBytes.toUpperCase().startsWith(header.substring(0, 4)),
    );

    if (!isValidImage) {
      throw new BadRequestException('Invalid image file');
    }

    // ❌ الثغرة: لو الملف بدأ بـ magic bytes صحيح، يقبل أي محتوى بعده
    const file = await this.prisma.labGenericContent.create({
      data: {
        userId,
        labId,
        title: fileName,
        body: fileContent,
        isPublic: true,
      },
    });

    return { success: true, file };
  }

  // ❌ الثغرة: Polyglot file upload
  async uploadPolyglot(
    userId: string,
    labId: string,
    fileName: string,
    fileContent: string,
  ) {
    // ملف يكون valid image و valid PHP في نفس الوقت!
    // مثلاً: صورة فيها PHP code في الـ metadata

    const file = await this.prisma.labGenericContent.create({
      data: {
        userId,
        labId,
        title: fileName,
        body: fileContent,
        isPublic: true,
      },
    });

    // التحقق من polyglot
    const isPolyglot =
      fileContent.includes('<?php') &&
      (fileContent.includes('FFD8FF') || fileContent.includes('89504E47'));

    if (isPolyglot) {
      return {
        success: true,
        file,
        exploited: true,
        flag: 'FLAG{POLYGLOT_FILE_UPLOADED}',
        message: 'Polyglot file uploaded! Valid image + executable code',
      };
    }

    return { success: true, file };
  }

  // ❌ الثغرة: SVG upload (XML-based, يمكن فيه XSS)
  async uploadSvg(
    userId: string,
    labId: string,
    fileName: string,
    svgContent: string,
  ) {
    // ❌ الثغرة: SVG files يمكن تحتوي على JavaScript
    const extension = fileName
      .substring(fileName.lastIndexOf('.'))
      .toLowerCase();

    if (extension !== '.svg') {
      throw new BadRequestException('Only SVG allowed');
    }

    // ❌ مابينظفش الـ SVG content من scripts
    const file = await this.prisma.labGenericContent.create({
      data: {
        userId,
        labId,
        title: fileName,
        body: svgContent,
        isPublic: true,
      },
    });

    const hasScript =
      svgContent.includes('<script>') || svgContent.includes('onload=');

    if (hasScript) {
      return {
        success: true,
        file,
        exploited: true,
        flag: 'FLAG{SVG_XSS_UPLOADED}',
        warning: 'SVG with XSS uploaded!',
        message: 'SVG uploaded successfully',
      };
    }

    return { success: true, file };
  }

  async listFiles(userId: string, labId: string) {
    const files = await this.prisma.labGenericContent.findMany({
      where: { userId, labId },
      select: { id: true, title: true },
    });
    return { files };
  }

  async getHints(userId: string, labId: string) {
    return {
      hints: [
        'MIME type is set by client - it can be spoofed',
        'Try uploading PHP code with image/jpeg MIME type',
        'Magic bytes can be prepended to malicious files',
        'SVG files can contain JavaScript',
        'Polyglot files are valid in multiple formats',
      ],
    };
  }
}
