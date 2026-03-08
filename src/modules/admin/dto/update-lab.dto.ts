import { PartialType } from '@nestjs/mapped-types';
import { CreateLabDto } from './create-lab.dto';

/**
 * UpdateLabDto — all fields from CreateLabDto made optional.
 * Uses NestJS PartialType to preserve all validation decorators.
 */
export class UpdateLabDto extends PartialType(CreateLabDto) {}
