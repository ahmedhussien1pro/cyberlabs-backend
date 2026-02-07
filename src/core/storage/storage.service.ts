import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly r2PublicUrl: string;

  constructor(private configService: ConfigService) {
    this.r2PublicUrl =
      this.configService.get<string>('storage.r2.publicUrl') ?? '';
  }

  /**
   * Get full URL for an image
   */
  getImageUrl(fileName: string): string {
    return `${this.r2PublicUrl}/${fileName}`;
  }

  /**
   * Get image URL or return null if no image
   */
  getImageUrlOrNull(fileName: string | null): string | null {
    if (!fileName) return null;
    return this.getImageUrl(fileName);
  }
}
