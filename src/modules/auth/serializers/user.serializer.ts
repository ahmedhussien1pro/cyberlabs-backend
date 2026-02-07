import { Expose } from 'class-transformer';
import { UserRole, Language } from '../../../common/enums';

export class UserSerializer {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  role: UserRole;

  @Expose()
  isEmailVerified: boolean;

  @Expose()
  isActive: boolean;

  @Expose()
  isPremium: boolean;

  @Expose()
  preferredLanguage: Language;

  @Expose()
  avatarUrl: string;

  @Expose()
  createdAt: Date;
}
