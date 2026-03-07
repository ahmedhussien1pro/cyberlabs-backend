import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class R2Service {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(private config: ConfigService) {
    this.bucket = this.config.get<string>('R2_BUCKET_NAME')!;

    /**
     * Strip any trailing slash from R2_PUBLIC_URL.
     * Without this, a value like "https://pub-xxx.r2.dev/" would produce
     * double-slash URLs: "https://pub-xxx.r2.dev//users/..."
     */
    this.publicUrl = (
      this.config.get<string>('R2_PUBLIC_URL') ?? ''
    ).replace(/\/+$/, '');

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.config.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.get<string>('R2_ACCESS_KEY_ID')!,
        secretAccessKey: this.config.get<string>('R2_SECRET_ACCESS_KEY')!,
      },
    });
  }

  /**
   * Build a public URL for a given R2 object key.
   * Single source of truth — use this everywhere instead of
   * manually concatenating config.get('R2_PUBLIC_URL') + key.
   */
  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  /**
   * Generate a presigned URL for a browser-initiated avatar upload.
   * Key format: users/{userId}/avatar/{uuid}.{ext}
   * Expires in 5 minutes.
   *
   * NOTE: The R2 bucket MUST have CORS configured to allow
   * PUT requests from the frontend origin:
   * https://developers.cloudflare.com/r2/buckets/cors/
   */
  async getPresignedUploadUrl(
    userId: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    const ext = contentType.split('/')[1] ?? 'jpg';
    const key = `users/${userId}/avatar/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: 300, // 5 minutes
    });

    return {
      uploadUrl,
      key,
      publicUrl: this.getPublicUrl(key),
    };
  }

  /**
   * Delete an object from R2 by key.
   */
  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  /**
   * Extract R2 key from a public URL.
   */
  extractKey(publicUrl: string): string | null {
    try {
      const url = new URL(publicUrl);
      return url.pathname.slice(1); // remove leading /
    } catch {
      return null;
    }
  }
}
