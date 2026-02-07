import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;
  private readonly iv: Buffer;

  constructor(private configService: ConfigService) {
    const encryptionKey = this.configService.get<string>(
      'security.encryptionKey',
    );

    // Generate a default key if not provided or invalid
    if (!encryptionKey || encryptionKey.length !== 32) {
      console.warn(
        '⚠️  ENCRYPTION_KEY is missing or invalid. Using default key (NOT RECOMMENDED for production)',
      );
      // Generate a consistent default key (NOT for production use!)
      this.key = Buffer.from('default-encryption-key-32char', 'utf-8');
    } else {
      this.key = Buffer.from(encryptionKey, 'utf-8');
    }

    // Generate IV
    this.iv = crypto.randomBytes(16);
  }

  /**
   * Encrypt data
   */
  encrypt(text: string): string {
    const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${this.iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');
    const ivBuffer = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      ivBuffer,
    );
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Hash data (one-way)
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate random string
   */
  generateRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
  }

  /**
   * Generate secure token
   */
  generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
