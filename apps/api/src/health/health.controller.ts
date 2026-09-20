import { Controller, Get, Inject } from '@nestjs/common';
import { sql, type Database } from '@repo/db';
import { DATABASE } from '../db/database.constants';

@Controller('health')
export class HealthController {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  @Get()
  async check(): Promise<{ status: string; db: 'up' | 'down'; time: string }> {
    let db: 'up' | 'down' = 'down';
    try {
      await this.db.execute(sql`select 1`);
      db = 'up';
    } catch {
      db = 'down';
    }
    return { status: 'ok', db, time: new Date().toISOString() };
  }
}
