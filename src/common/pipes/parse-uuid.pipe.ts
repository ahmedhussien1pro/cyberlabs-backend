import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

/**
 * Parse UUID Pipe
 * Validates and transforms UUID parameters
 * Usage: @Param('id', ParseUUIDPipe) id: string
 */
@Injectable()
export class ParseUUIDPipe implements PipeTransform<string, Promise<string>> {
  async transform(value: string): Promise<string> {
    const { validate: isUuid } = await import('uuid');

    if (!isUuid(value)) {
      throw new BadRequestException('Invalid UUID format');
    }

    return value;
  }
}
