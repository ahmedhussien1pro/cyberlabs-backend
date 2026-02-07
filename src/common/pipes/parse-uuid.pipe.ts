import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { validate as isUuid } from 'uuid';

/**
 * Parse UUID Pipe
 * Validates and transforms UUID parameters
 * Usage: @Param('id', ParseUUIDPipe) id: string
 */
@Injectable()
export class ParseUUIDPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isUuid(value)) {
      throw new BadRequestException('Invalid UUID format');
    }

    return value;
  }
}
