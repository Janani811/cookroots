import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DbModule } from '../db';
import { NotificationsModule } from '../notifications/notifications.module';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';

@Module({
  imports: [DbModule, AuthModule, NotificationsModule],
  controllers: [SocialController],
  providers: [SocialService],
})
export class SocialModule {}
