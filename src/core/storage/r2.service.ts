// src/core/storage/r2.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class R2Service implements OnModuleInit {
  private readonly logger = new Logger(R2Service.name);

  private client!: S3Client;
  private bucket!: string;
  private publicUrl!: string;
  private ready = false;

  constructor(private config: ConfigService) {}

  // ── Lazy init after env is fully loaded ──────────────────────────────────
  onModuleInit() {
    const accountId  = this.config.get<string>('R2_ACCOUNT_ID');
    const accessKey  = this.config.get<string>('R2_ACCESS_KEY_ID');
    const secretKey  = this.config.get<string>('R2_SECRET_ACCESS_KEY');
    const bucketName = this.config.get<string>('R2_BUCKET_NAME');
    const pubUrl     = this.config.get<string>('R2_PUBLIC_URL') ?? '';

    if (!accountId || !accessKey || !secretKey || !bucketName) {
      this.logger.warn(
        '⚠️  R2 env vars missing — upload features disabled. ' +
        'Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME',
      );
      return;
    }

    this.bucket    = bucketName;
    this.publicUrl = pubUrl.replace(/\/+$/, '');

    this.client = new S3Client({
      region:   'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });

    this.ready = true;
    this.logger.log('✅ R2 storage ready');
  }

  isReady(): boolean { return this.ready; }

  // ── Public URL ────────────────────────────────────────────────────────────
  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  // ── Presigned PUT URL (browser → R2 direct) ───────────────────────────────
  async getPresignedUploadUrl(
    userId: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    if (!this.ready) throw new Error('R2 storage is not configured');

    const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
    const key = `users/${userId}/avatar/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket:      this.bucket,
      Key:         key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 300 });
    return { uploadUrl, key, publicUrl: this.getPublicUrl(key) };
  }

  // ── Presigned PUT URL for any key (admin use) ─────────────────────────────
  async getAdminPresignedUploadUrl(
    folder: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    if (!this.ready) throw new Error('R2 storage is not configured');

    const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
    const key = `${folder}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket:      this.bucket,
      Key:         key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 300 });
    return { uploadUrl, key, publicUrl: this.getPublicUrl(key) };
  }

  // ── Server-side buffer upload ─────────────────────────────────────────────
  async uploadBuffer(options: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<string> {
    if (!this.ready) throw new Error('R2 storage is not configured');

    await this.client.send(
      new PutObjectCommand({
        Bucket:      this.bucket,
        Key:         options.key,
        Body:        options.body,
        ContentType: options.contentType,
      }),
    );

    return this.getPublicUrl(options.key);
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async deleteObject(key: string): Promise<void> {
    if (!this.ready) return;
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  // ── Extract key from URL ──────────────────────────────────────────────────
  extractKey(publicUrl: string): string | null {
    try {
      return new URL(publicUrl).pathname.slice(1);
    } catch {
      return null;
    }
  }
}
