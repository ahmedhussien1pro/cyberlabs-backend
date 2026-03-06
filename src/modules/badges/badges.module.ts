import { Module } from '@nestjs/common';
import { BadgesController } from './badges.controller';
import { BadgesService } from './badges.service';

@Module({
  controllers: [BadgesController],
  providers: [BadgesService],
  exports: [BadgesService], // exported so PracticeLabsService can inject it
})
export class BadgesModule {}
