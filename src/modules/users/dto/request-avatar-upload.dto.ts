import { IsIn, IsString } from 'class-validator';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export class RequestAvatarUploadDto {
  @IsString()
  @IsIn(ALLOWED_TYPES, {
    message: 'contentType must be image/jpeg, image/png, or image/webp',
  })
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
}
