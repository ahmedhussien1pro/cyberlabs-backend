import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToInstance } from 'class-transformer';

/**
 * Serialize Interceptor
 * Serializes response using class-transformer
 * Removes sensitive fields based on @Exclude() decorators
 */
@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto: any) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data: any) => {
        if (!data) return data;

        // Handle arrays
        if (Array.isArray(data)) {
          return data.map((item) =>
            plainToInstance(this.dto, item, {
              excludeExtraneousValues: true,
              enableImplicitConversion: true,
            }),
          );
        }

        // Handle paginated responses
        if (data.data && Array.isArray(data.data)) {
          return {
            ...data,
            data: data.data.map((item: any) =>
              plainToInstance(this.dto, item, {
                excludeExtraneousValues: true,
                enableImplicitConversion: true,
              }),
            ),
          };
        }

        // Handle single objects
        return plainToInstance(this.dto, data, {
          excludeExtraneousValues: true,
          enableImplicitConversion: true,
        });
      }),
    );
  }
}
