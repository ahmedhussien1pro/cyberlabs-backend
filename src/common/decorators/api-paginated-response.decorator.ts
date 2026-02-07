import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

/**
 * API Standard Response Decorator
 * Swagger decorator for standardized responses
 * Usage: @ApiStandardResponse(UserDto)
 * Usage: @ApiStandardResponse(UserDto, true) for arrays
 */
export const ApiStandardResponse = <TModel extends Type<any>>(
  model: TModel,
  isArray: boolean = false,
) => {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        allOf: [
          {
            properties: {
              success: {
                type: 'boolean',
                example: true,
              },
              message: {
                type: 'string',
                example: 'Success',
              },
              data: isArray
                ? {
                    type: 'array',
                    items: { $ref: getSchemaPath(model) },
                  }
                : { $ref: getSchemaPath(model) },
              timestamp: {
                type: 'string',
                example: new Date().toISOString(),
              },
            },
          },
        ],
      },
    }),
  );
};

/**
 * API Paginated Response Decorator
 * Swagger decorator for paginated responses
 * Usage: @ApiPaginatedResponse(UserDto)
 */
export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        allOf: [
          {
            properties: {
              success: {
                type: 'boolean',
                example: true,
              },
              message: {
                type: 'string',
                example: 'Success',
              },
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: {
                type: 'object',
                properties: {
                  page: { type: 'number', example: 1 },
                  pageSize: { type: 'number', example: 10 },
                  totalItems: { type: 'number', example: 100 },
                  totalPages: { type: 'number', example: 10 },
                  hasNextPage: { type: 'boolean', example: true },
                  hasPreviousPage: { type: 'boolean', example: false },
                },
              },
              timestamp: {
                type: 'string',
                example: new Date().toISOString(),
              },
            },
          },
        ],
      },
    }),
  );
};
