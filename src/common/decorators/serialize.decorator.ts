import { UseInterceptors, Type } from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';

/**
 * Serialize Decorator
 * Transforms response using class-transformer
 * Usage: @Serialize(UserDto)
 */
export function Serialize<T>(dto: Type<T>) {
  return UseInterceptors(ClassSerializerInterceptor);
}
