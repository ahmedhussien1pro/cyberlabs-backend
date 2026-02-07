import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HashingService {
  private readonly rounds: number;

  constructor(private configService: ConfigService) {
    this.rounds = this.configService.get<number>('security.bcryptRounds') || 12;
  }

  /**
   * Hash a string (password)
   */
  async hash(data: string): Promise<string> {
    return bcrypt.hash(data, this.rounds);
  }

  /**
   * Compare plain text with hash
   */
  async compare(data: string, encrypted: string): Promise<boolean> {
    return bcrypt.compare(data, encrypted);
  }
}
