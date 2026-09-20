import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { DbModule } from './db/db.module';
import { GroceryModule } from './grocery/grocery.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RecipesModule } from './recipes/recipes.module';
import { SocialModule } from './social/social.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    DbModule,
    AuthModule,
    RecipesModule,
    AiModule,
    SocialModule,
    GroceryModule,
    UploadModule,
    NotificationsModule,
    HealthModule,
  ],
})
export class AppModule {}
