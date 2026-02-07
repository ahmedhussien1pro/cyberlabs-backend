import { Injectable, BadRequestException } from '@nestjs/common';
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

  // ❌ الثغرة: Weak file validation
  async uploadFile(
    userId: string,
    labId: string,
    fileName: string,
    fileSize: number,
    fileContent: string,
  ) {
    // ❌ الثغرة 1: Client-side extension check only
    // يعتمد على الـ extension بس بدون magic bytes check
    const extension = fileName
      .substring(fileName.lastIndexOf('.'))
      .toLowerCase();

    // ❌ الثغرة 2: Weak extension validation
    const dangerousExtensions = [
      '.php',
      '.jsp',
      '.asp',
      '.exe',
      '.sh',
      '.py',
      '.rb',
    ];

    // ❌ الثغرة 3: Case-sensitive check - يمكن bypass بـ .PHP أو .Php
    if (dangerousExtensions.includes(extension)) {
      throw new BadRequestException('File type not allowed');
    }

    // ❌ الثغرة 4: Size check ضعيف
    if (fileSize > 10 * 1024 * 1024) {
      // 10MB
      throw new BadRequestException('File too large');
    }

    // حفظ معلومات الملف
    const uploadedFile = await this.prisma.labGenericContent.create({
      data: {
        userId,
        labId,
        title: fileName,
        body: fileContent,
        isPublic: true,
      },
    });

    // التحقق من الاستغلال
    const maliciousPatterns = [
      '.php',
      '.jsp',
      '.asp',
      '.exe',
      'shell',
      'eval',
      'system',
    ];
    const isMalicious = maliciousPatterns.some(
      (pattern) =>
        fileName.toLowerCase().includes(pattern) ||
        fileContent.toLowerCase().includes(pattern),
    );

    if (isMalicious) {
      return {
        success: true,
        file: uploadedFile,
        exploited: true,
        flag: 'FLAG{MALICIOUS_FILE_UPLOADED}',
        warning: 'Malicious file uploaded! Weak validation bypassed',
        message: 'File uploaded successfully',
      };
    }

    return {
      success: true,
      file: uploadedFile,
      message: 'File uploaded successfully',
    };
  }

  // ❌ الثغرة: No sanitization على file names
  async uploadWithCustomName(
    userId: string,
    labId: string,
    fileName: string,
    fileContent: string,
  ) {
    // ❌ الثغرة: يقبل أي اسم ملف بدون sanitization
    // يمكن upload ملفات بأسماء خطيرة: ../../../etc/passwd

    const file = await this.prisma.labGenericContent.create({
      data: {
        userId,
        labId,
        title: fileName, // ❌ بدون sanitization!
        body: fileContent,
        isPublic: true,
      },
    });

    return { success: true, file, message: 'File uploaded' };
  }

  // ❌ الثغرة: Double extension bypass
  async uploadWithDoubleExtension(
    userId: string,
    labId: string,
    fileName: string,
    fileContent: string,
  ) {
    // ❌ الثغرة: يتحقق من آخر extension بس
    // يمكن bypass بـ: shell.php.jpg
    const lastDot = fileName.lastIndexOf('.');
    const extension = fileName.substring(lastDot).toLowerCase();

    if (!['.jpg', '.png', '.gif'].includes(extension)) {
      throw new BadRequestException('Only images allowed');
    }

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

  // List uploaded files
  async listFiles(userId: string, labId: string) {
    const files = await this.prisma.labGenericContent.findMany({
      where: { userId, labId },
      select: { id: true, title: true },
    });

    return { files };
  }

  // ❌ الثغرة: Direct file access بدون authorization
  async getFile(userId: string, labId: string, fileId: string) {
    const file = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, id: fileId },
    });

    if (!file) {
      throw new BadRequestException('File not found');
    }

    return { file };
  }

  // Hints
  async getHints(userId: string, labId: string) {
    return {
      hints: [
        'Try double extensions: file.php.jpg',
        'Try case variations: .PHP, .Php',
        'Try null byte injection: shell.php%00.jpg',
        'Try special characters in filename',
        'Content-Type header can be spoofed',
      ],
    };
  }
}
