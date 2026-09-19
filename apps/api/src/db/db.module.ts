import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createDb } from '@repo/db';

import { DATABASE } from './database.constants';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DATABASE,
      useFactory: (configService: ConfigService) =>
        createDb({ logger: configService.get<string>('DEBUG') === 'true' }),
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE],
})
export class DbModule {}
