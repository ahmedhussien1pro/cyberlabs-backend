import { Module } from '@nestjs/common';
import { UsersController } from './controllers';
import { UsersService } from './services';
import { DatabaseModule } from '../../core/database';
import { StorageModule } from '../../core/storage';
@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
