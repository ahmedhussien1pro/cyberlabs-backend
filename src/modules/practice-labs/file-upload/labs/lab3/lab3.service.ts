import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab3Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ❌ الثغرة: Path traversal في file upload
  async uploadToPath(
    userId: string,
    labId: string,
    fileName: string,
    filePath: string,
    fileContent: string,
  ) {
    // ❌ الثغرة: يقبل path من الـ client بدون sanitization
    // يمكن استخدام: ../../../etc/passwd أو ../../admin/shell.php

    const fullPath = `${filePath}/${fileName}`;

    // ❌ Weak path validation
    if (fullPath.includes('..')) {
      // ❌ التحقق سطحي - يمكن bypass بـ: ..%2F أو ..\/
      throw new BadRequestException('Invalid path');
    }

    const file = await this.prisma.labGenericContent.create({
      data: {
        userId,
        labId,
        title: fileName,
        body: fileContent,
        author: fullPath, // نخزن الـ path في author
        isPublic: true,
      },
    });

    // التحقق من الاستغلال
    if (
      filePath.includes('..') ||
      filePath.includes('admin') ||
      filePath.includes('root')
    ) {
      return {
        success: true,
        file,
        exploited: true,
        flag: 'FLAG{PATH_TRAVERSAL_EXPLOITED}',
        warning:
          'Path traversal exploited! File uploaded outside intended directory',
        uploadedTo: fullPath,
      };
    }

    return { success: true, file, uploadedTo: fullPath };
  }

  // ❌ الثغرة: يقبل absolute paths
  async uploadAbsolutePath(
    userId: string,
    labId: string,
    fullPath: string,
    fileContent: string,
  ) {
    // ❌ الثغرة: يقبل absolute path من الـ client
    // مثلاً: /var/www/html/shell.php

    const file = await this.prisma.labGenericContent.create({
      data: {
        userId,
        labId,
        title: fullPath.split('/').pop() || 'file',
        body: fileContent,
        author: fullPath,
        isPublic: true,
      },
    });

    return { success: true, file, uploadedTo: fullPath };
  }

  // ❌ الثغرة: Filename with path separators
  async uploadWithSeparators(
    userId: string,
    labId: string,
    fileName: string,
    fileContent: string,
  ) {
    // ❌ الثغرة: Filename يمكن يحتوي على / أو \
    // مثلاً: ../../admin/shell.php

    const file = await this.prisma.labGenericContent.create({
      data: {
        userId,
        labId,
        title: fileName, // ❌ بدون sanitization
        body: fileContent,
        isPublic: true,
      },
    });

    const hasTraversal =
      fileName.includes('../') ||
      fileName.includes('..\\') ||
      fileName.includes('/') ||
      fileName.includes('\\');

    if (hasTraversal) {
      return {
        success: true,
        file,
        exploited: true,
        flag: 'FLAG{FILENAME_PATH_TRAVERSAL}',
        warning: 'Filename contains path separators!',
      };
    }

    return { success: true, file };
  }

  // ❌ الثغرة: ZIP file upload with path traversal inside
  async uploadZip(
    userId: string,
    labId: string,
    zipFileName: string,
    zipContents: Array<{ name: string; content: string }>,
  ) {
    // ❌ الثغرة: ZIP files يمكن تحتوي على ملفات بـ paths خطيرة
    // مثلاً: ../../../etc/cron.d/backdoor

    const files: any[] = [];
    let exploited = false;

    for (const entry of zipContents) {
      const file = await this.prisma.labGenericContent.create({
        data: {
          userId,
          labId,
          title: entry.name,
          body: entry.content,
          author: zipFileName,
          isPublic: true,
        },
      });

      files.push(file);

      if (entry.name.includes('../') || entry.name.includes('..\\')) {
        exploited = true;
      }
    }

    if (exploited) {
      return {
        success: true,
        files,
        exploited: true,
        flag: 'FLAG{ZIP_PATH_TRAVERSAL}',
        warning: 'ZIP contains files with path traversal!',
        message: `Extracted ${files.length} files from ZIP`,
      };
    }

    return {
      success: true,
      files,
      message: `Extracted ${files.length} files from ZIP`,
    };
  }

  // ❌ الثغرة: Overwrite existing files
  async uploadOverwrite(
    userId: string,
    labId: string,
    targetFile: string,
    newContent: string,
  ) {
    // ❌ الثغرة: يسمح بالـ overwrite لأي ملف
    // مثلاً: overwrite config.php أو .htaccess

    const existing = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, title: targetFile },
    });

    if (existing) {
      await this.prisma.labGenericContent.update({
        where: { id: existing.id },
        data: { body: newContent },
      });

      return {
        success: true,
        message: 'File overwritten',
        warning: 'Existing file was replaced!',
        file: targetFile,
      };
    }

    return { success: false, message: 'File not found' };
  }

  async listFiles(userId: string, labId: string) {
    const files = await this.prisma.labGenericContent.findMany({
      where: { userId, labId },
      select: { id: true, title: true, author: true },
    });
    return { files };
  }

  async getHints(userId: string, labId: string) {
    return {
      hints: [
        'Try path traversal: ../../../admin/shell.php',
        'Try URL encoding: ..%2F..%2Fadmin',
        'Try double encoding: ..%252F',
        'Try absolute paths: /var/www/html/backdoor.php',
        'Try null byte injection: shell.php%00.jpg',
        'ZIP files can contain paths in filenames',
      ],
    };
  }
}
