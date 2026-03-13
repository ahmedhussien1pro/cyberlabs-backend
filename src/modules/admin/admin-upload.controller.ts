// src/modules/admin/admin-upload.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminGuard } from '../../common/guards';
import { R2Service } from '../../core/storage/r2.service';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@UseGuards(AdminGuard)
@Controller('admin/upload')
export class AdminUploadController {
  private client: S3Client;
  private bucket: string;

  constructor(
    private readonly r2: R2Service,
    private readonly config: ConfigService,
  ) {
    this.bucket = this.config.get<string>('R2_BUCKET_NAME')!;
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.config.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId:     this.config.get<string>('R2_ACCESS_KEY_ID')!,
        secretAccessKey: this.config.get<string>('R2_SECRET_ACCESS_KEY')!,
      },
    });
  }

  /**
   * POST /admin/upload/image
   * multipart/form-data: file (image/*)
   *
   * Returns: { url: string }  — public Cloudflare R2 URL
   *
   * Used by curriculum editor: when saving a topic that has image elements
   * with a pending local blob, the frontend uploads them here first to get
   * a persistent URL, then saves the curriculum with that URL.
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
    if (!file) throw new BadRequestException('Image file is required');

    const ext = file.mimetype.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
    const key = `courses/curriculum/${randomUUID()}.${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket:      this.bucket,
        Key:         key,
        Body:        file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const url = this.r2.getPublicUrl(key);
    return { url, key };
  }
}
