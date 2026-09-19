import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { GroceryModule } from './grocery/grocery.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RecipesModule } from './recipes/recipes.module';
import { SocialModule } from './social/social.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    RecipesModule,
    AiModule,
    SocialModule,
    GroceryModule,
    UploadModule,
    NotificationsModule,
  ],
})
export class AppModule {}
