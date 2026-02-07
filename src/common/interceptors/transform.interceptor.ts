import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/response.interface';

/**
 * Transform Interceptor
 * Wraps all responses in standardized ApiResponse format
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data is already in ApiResponse format, return as-is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Wrap in ApiResponse format
        return {
          success: true,
          message: 'Success',
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
