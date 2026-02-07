import { ValidationPipe as NestValidationPipe } from '@nestjs/common';

/**
 * Custom Validation Pipe Configuration
 * Pre-configured validation pipe with best practices
 */
export const ValidationPipe = new NestValidationPipe({
  whitelist: true, // Strip properties without decorators
  forbidNonWhitelisted: true, // Throw error on extra properties
  transform: true, // Auto-transform payloads to DTO instances
  transformOptions: {
    enableImplicitConversion: true, // Auto-convert types
  },
  validationError: {
    target: false, // Don't expose target object
    value: false, // Don't expose value
  },
  stopAtFirstError: false, // Return all errors
});
