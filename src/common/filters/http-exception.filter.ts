import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../../core/logger/logger.service';

/**
 * HTTP Exception Filter
 * Handles all HttpExceptions and formats error responses
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private logger: LoggerService) {
    this.logger.setContext('HttpException');
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || 'An error occurred';

    const errorResponse = {
      success: false,
      message: Array.isArray(message) ? message[0] : message,
      error: exception.name,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log error
    this.logger.error(
      `${request.method} ${request.url} ${status} - ${errorResponse.message}`,
      exception.stack,
    );

    response.status(status).json(errorResponse);
  }
}
