import { IsInt, Min, Max } from 'class-validator';

export class ExtendSessionDto {
  /** Extra minutes to add — capped at 60 */
  @IsInt()
  @Min(5)
  @Max(60)
  minutes: number;
}
