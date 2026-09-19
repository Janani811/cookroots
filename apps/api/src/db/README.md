# DB Module

The DB Module provides a centralized PostgreSQL connection for the Cookroots API using Drizzle ORM, backed by a `pg` connection pool.

## Setup

### 1. Environment Variables

Add to `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cookroots
DB_USER=postgres
DB_PASSWORD=password
```

SSL is enabled automatically when `NODE_ENV=production` (needed for managed Postgres like Neon/Supabase).

### 2. Import in AppModule

The DbModule is automatically imported in `app.module.ts`:
```typescript
import { DbModule } from './db/db.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    // ... other modules
  ],
})
export class AppModule {}
```

## Usage

### In Services

Inject the database using the `DATABASE` token:

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '../db/database.constants';
import type { Database } from '@repo/db';
import { recipes, eq } from '@repo/db';

@Injectable()
export class MyService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findRecipe(id: string) {
    const [recipe] = await this.db
      .select()
      .from(recipes)
      .where(eq(recipes.id, id))
      .limit(1);
    
    return recipe || null;
  }
}
```

## How It Works

1. **DbModule** (`db.module.ts`)
   - Builds a `pg` `Pool` from `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` (see `@repo/db`'s `config/database.config.ts`)
   - Creates a database provider
   - Exports the `DATABASE` token for injection

2. **Schema** (`@repo/db`)
   - All table definitions are in `packages/db/src/schema`
   - Drizzle ORM provides type-safe queries
   - Auto-generated TypeScript types from schema

## Available Imports

From `@repo/db` you can import:
- Table definitions: `recipes`, `ingredients`, `steps`, `users`, etc.
- Query helpers: `eq`, `and`, `or`, `ilike`, `sql`, etc.
- Types: `Database`, `InferSelectModel`, etc.

Example:
```typescript
import { 
  recipes,           // Table
  ingredients,       // Table
  eq,               // Operator
  ilike,            // Like operator
  and,              // And operator
  Database,         // Type
} from '@repo/db';
```

## Creating Tables

To add new tables:

1. Define table in `packages/db/src/schema`
2. Generate migration: `cd packages/db && npm run migration:generate`
3. Sync to database: `npm run migration:push`
4. Import and use in services

## Debugging

### View Database Data

```bash
cd packages/db
npm run migration:studio
# Visit http://localhost:5555
```

### Check Connection

The `pg` `Pool` will fail to connect if `DB_HOST`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` are unset or invalid.

## References

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Database Schema](../../packages/db/src/schema)
