import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { LoggerService } from '../../core/logger/logger.service';

/**
 * Prisma Exception Filter
 * Handles Prisma-specific errors and converts to HTTP responses
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  constructor(private logger: LoggerService) {
    this.logger.setContext('PrismaException');
  }

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';

    // Handle specific Prisma error codes
    switch (exception.code) {
      case 'P2002':
        // Unique constraint violation
        status = HttpStatus.CONFLICT;
        const field = (exception.meta?.target as string[])?.[0] || 'field';
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
        break;

      case 'P2025':
        // Record not found
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;

      case 'P2003':
        // Foreign key constraint violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Related record does not exist';
        break;

      case 'P2014':
        // Invalid ID
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid ID provided';
        break;

      case 'P2016':
        // Query interpretation error
        status = HttpStatus.BAD_REQUEST;
        message = 'Query interpretation error';
        break;

      case 'P2021':
        // Table does not exist
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Database table does not exist';
        break;

      case 'P2022':
        // Column does not exist
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Database column does not exist';
        break;

      default:
        this.logger.error(
          `Unhandled Prisma error code: ${exception.code}`,
          exception.stack,
        );
    }

    const errorResponse = {
      success: false,
      message,
      error: 'DatabaseError',
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.error(
      `${request.method} ${request.url} ${status} - ${message} (Prisma: ${exception.code})`,
    );

    response.status(status).json(errorResponse);
  }
}
