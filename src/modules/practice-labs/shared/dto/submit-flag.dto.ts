import { IsString, IsNotEmpty } from 'class-validator';
export class SubmitFlagDto {
  @IsString()
  @IsNotEmpty()
  flag: string;
}
