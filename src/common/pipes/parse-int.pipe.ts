import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

/**
 * Parse Int Pipe
 * Validates and transforms integer parameters
 * Usage: @Param('id', new ParseIntPipe({ min: 1 })) id: number
 */
@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  constructor(private readonly options?: { min?: number; max?: number }) {}

  transform(value: string): number {
    const parsed = parseInt(value, 10);

    if (isNaN(parsed)) {
      throw new BadRequestException('Value must be an integer');
    }

    if (this.options?.min !== undefined && parsed < this.options.min) {
      throw new BadRequestException(
        `Value must be at least ${this.options.min}`,
      );
    }

    if (this.options?.max !== undefined && parsed > this.options.max) {
      throw new BadRequestException(
        `Value must be at most ${this.options.max}`,
      );
    }

    return parsed;
  }
}
