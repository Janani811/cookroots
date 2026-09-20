import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { RootController } from './root.controller';

@Module({ imports: [DbModule], controllers: [RootController] })
export class RootModule {}
