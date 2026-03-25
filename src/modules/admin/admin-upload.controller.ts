// src/modules/admin/admin-upload.controller.ts
//
// Upload flow (presigned — browser → R2 direct, same as avatar):
//
//  1. Admin panel calls POST /admin/upload/image/presign  { contentType }
//  2. Backend returns { uploadUrl, key, publicUrl }  (expires in 5 min)
//  3. Admin panel does: PUT uploadUrl  with file body + Content-Type header
//  4. Admin panel stores publicUrl as the image field value in the form
//
// No file ever passes through NestJS — no 503, no server-side R2 dependency.

import {
  Controller,
  Post,
  Body,
  UseGuards,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AdminGuard } from '../../common/guards';
import { R2Service } from '../../core/storage/r2.service';

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

// Folder mapping by context
const FOLDER_MAP: Record<string, string> = {
  path:       'admin/paths',
  course:     'admin/courses',
  lab:        'admin/labs',
  badge:      'admin/badges',
  general:    'admin/images',
};

@UseGuards(AdminGuard)
@Controller('admin/upload')
export class AdminUploadController {
  constructor(private readonly r2: R2Service) {}

  /**
   * POST /admin/upload/image/presign
   * Body: { contentType: string, context?: 'path' | 'course' | 'lab' | 'badge' | 'general' }
   *
   * Returns: { uploadUrl, key, publicUrl }
   * - uploadUrl: use as PUT target (expires in 5 min)
   * - key: pass to confirm endpoint if needed
   * - publicUrl: store directly as the image field value
   */
  @Post('image/presign')
  async presignImage(
    @Body('contentType') contentType: string,
    @Body('context') context = 'general',
  ) {
    if (!contentType) {
      throw new BadRequestException('contentType is required');
    }

    if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
      throw new BadRequestException(
        `contentType must be one of: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
      );
    }

    if (!this.r2.isReady()) {
      throw new ServiceUnavailableException(
        'Image upload temporarily unavailable — storage not configured',
      );
    }

    const folder = FOLDER_MAP[context] ?? FOLDER_MAP.general;

    const result = await this.r2.getAdminPresignedUploadUrl(folder, contentType);

    return {
      uploadUrl:  result.uploadUrl,
      key:        result.key,
      publicUrl:  result.publicUrl,
      expiresIn:  300,
    };
  }
}
