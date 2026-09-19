import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createDb } from '@repo/db';
import type { Database } from '@repo/db';

export const DATABASE = 'DATABASE';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DATABASE,
      useFactory: (configService: ConfigService): any => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        if (!databaseUrl) {
          throw new Error('DATABASE_URL environment variable is not set');
        }
        return createDb(databaseUrl);
      },
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
