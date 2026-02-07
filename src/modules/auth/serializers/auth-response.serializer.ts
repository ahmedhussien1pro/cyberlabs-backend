import { Expose, Type } from 'class-transformer';
import { UserSerializer } from './user.serializer';

export class AuthResponseSerializer {
  @Expose()
  @Type(() => UserSerializer)
  user: UserSerializer;

  @Expose()
  accessToken: string;

  @Expose()
  refreshToken: string;

  @Expose()
  expiresIn: number;
}
