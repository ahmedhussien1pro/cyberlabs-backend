import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseDto } from './create-course.dto';

/**
 * UpdateCourseDto — all fields from CreateCourseDto made optional.
 * Uses NestJS PartialType to preserve all validation decorators.
 */
export class UpdateCourseDto extends PartialType(CreateCourseDto) {}
