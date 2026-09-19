import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiClient } from '@repo/ai';
import { AuthModule } from '../auth/auth.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [AuthModule],
  controllers: [AiController],
  providers: [
    {
      provide: AiClient,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new AiClient({ apiKey: config.getOrThrow<string>('GEMINI_API_KEY') }),
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
