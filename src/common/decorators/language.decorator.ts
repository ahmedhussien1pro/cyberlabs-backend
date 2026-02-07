import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Language } from '../enums/common.enums';

/**
 * Language Decorator
 * Extracts language from Accept-Language header
 * Defaults to English if not specified
 * Usage: @Lang() lang: Language
 */
export const Lang = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Language => {
    const request = ctx.switchToHttp().getRequest();
    const acceptLanguage = request.headers['accept-language'];

    if (acceptLanguage?.toLowerCase().includes('ar')) {
      return Language.AR;
    }

    return Language.EN;
  },
);
