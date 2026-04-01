import { IsInt, Min } from 'class-validator';

export class UnlockHintDto {
  @IsInt()
  @Min(0)
  hintIndex: number;
}
