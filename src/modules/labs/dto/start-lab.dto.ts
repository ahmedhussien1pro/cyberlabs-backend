import { IsUUID, IsNotEmpty } from 'class-validator';

export class StartLabDto {
  @IsNotEmpty()
  @IsUUID()
  labId: string;
}
