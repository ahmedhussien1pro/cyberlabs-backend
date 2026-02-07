import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../../core/logger/logger.service';

/**
 * Logging Interceptor
 * Logs all incoming requests and outgoing responses
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logger: LoggerService) {
    this.logger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const user = request.user;
    const startTime = Date.now();

    // Log request
    this.logger.http(
      `→ ${method} ${url} - IP: ${ip} - User: ${user?.id || 'Anonymous'}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const duration = Date.now() - startTime;

          this.logger.http(`← ${method} ${url} ${statusCode} - ${duration}ms`);
        },
        error: (error) => {
          const duration = Date.now() - startTime;

          this.logger.error(
            `← ${method} ${url} ${error.status || 500} - ${duration}ms - ${error.message}`,
          );
        },
      }),
    );
  }
}
