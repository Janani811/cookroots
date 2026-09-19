import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database';
import { NotificationsModule } from '../notifications/notifications.module';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';

@Module({
  imports: [DatabaseModule, AuthModule, NotificationsModule],
  controllers: [SocialController],
  providers: [SocialService],
})
export class SocialModule {}
