# Database Module

The Database Module provides a centralized PostgreSQL connection for the Cooksy API using Drizzle ORM.

## Setup

### 1. Environment Variable

Add to `.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/cooksy
```

### 2. Import in AppModule

The DatabaseModule is automatically imported in `app.module.ts`:
```typescript
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
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
import { DATABASE } from '../database/database.module';
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

1. **DatabaseModule** (`database.module.ts`)
   - Reads `DATABASE_URL` from environment
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
2. Generate migration: `cd packages/db && pnpm db:generate`
3. Sync to database: `pnpm db:push`
4. Import and use in services

## Debugging

### View Database Data

```bash
cd packages/db
pnpm db:studio
# Visit http://localhost:5555
```

### Check Connection

The module will throw an error if `DATABASE_URL` is not set or invalid.

## References

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Database Schema](../../packages/db/src/schema)
