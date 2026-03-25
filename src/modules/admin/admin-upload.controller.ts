// src/modules/admin/admin-upload.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminGuard } from '../../common/guards';
import { R2Service } from '../../core/storage/r2.service';
import { randomUUID } from 'crypto';

@UseGuards(AdminGuard)
@Controller('admin/upload')
export class AdminUploadController {
  constructor(private readonly r2: R2Service) {}

  /**
   * POST /admin/upload/image
   * multipart/form-data: { file: image/* }
   *
   * Uploads an image to Cloudflare R2 and returns its public URL.
   * Used by the admin panel for thumbnails, path covers, course images, etc.
   *
   * Returns: { url: string, key: string }
   */
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    if (!this.r2.isReady()) {
      throw new ServiceUnavailableException(
        'Image upload is temporarily unavailable — storage not configured',
      );
    }

    const ext = file.mimetype.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
    const key = `admin/images/${randomUUID()}.${ext}`;

    const url = await this.r2.uploadBuffer({
      key,
      body:        file.buffer,
      contentType: file.mimetype,
    });

    return { url, key };
  }
}
