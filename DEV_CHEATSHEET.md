# 📋 Cooksy Dev Quick Reference

## Quick Commands

```bash
# Setup
pnpm install
pnpm db:push              # Setup database
turbo dev                 # Run all dev servers

# In separate terminals:
cd apps/api && pnpm dev   # API port 4000
cd apps/web && pnpm dev   # Web port 3000

# Database
cd packages/db
pnpm db:push              # Sync schema
pnpm db:studio            # View data (localhost:5555)
pnpm db:generate          # Generate types
```

## Important URLs

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:4000 |
| API Docs | http://localhost:4000/api (NestJS Swagger) |
| DB Studio | http://localhost:5555 |

## Key File Locations

```
Recipes
  API Controller: apps/api/src/recipes/recipes.controller.ts
  API Service: apps/api/src/recipes/recipes.service.ts
  Web Pages: apps/web/app/recipes/

AI Features
  API Service: apps/api/src/ai/ai.service.ts
  Client: packages/ai/src/client.ts
  Prompts: packages/ai/src/prompts.ts

Database
  Schema: packages/db/src/schema/
  Migrations: packages/db/drizzle/

Types
  All shared types: packages/types/src/index.ts
```

## Common Tasks

### Add API Endpoint
```typescript
// 1. Create DTO (dto/name.dto.ts)
export class MyDto { ... }

// 2. Add controller method
@Post('endpoint')
async myMethod(@Body() dto: MyDto) {
  return this.service.method(dto);
}

// 3. Add service logic
async method(dto: MyDto) { ... }
```

### Use API in Web
```typescript
import { api } from '@/lib/api';

// Call it
const data = await api.getRecipes({ search: 'pasta' });
```

### Add Database Table
```typescript
// 1. Edit packages/db/src/schema/
export const myTable = pgTable('my_table', {
  id: uuid().primaryKey(),
  name: varchar(),
});

// 2. Generate & sync
cd packages/db && pnpm db:generate && pnpm db:push
```

### Protect API Route
```typescript
import { AuthGuard } from './auth/auth.guard';

@Post('endpoint')
@UseGuards(AuthGuard)
async protect(@Req() req: Request) {
  const userId = (req as any).userId;
  return this.service.method(userId);
}
```

## API Endpoints (Existing)

### Recipes
```
GET    /api/recipes           # List recipes (search, filter)
POST   /api/recipes           # Create recipe
GET    /api/recipes/:id       # Get one recipe
DELETE /api/recipes/:id       # Delete recipe
POST   /api/recipes/match     # Find by ingredients
```

### AI
```
POST   /api/ai/structure      # Text → recipe
POST   /api/ai/improve        # Better suggestions
POST   /api/ai/normalize      # Ingredient names
POST   /api/ai/tts            # Text → speech
```

### Social
```
POST   /api/social/likes      # Like recipe
DELETE /api/social/likes/:id  # Unlike
GET    /api/social/comments   # Get comments
POST   /api/social/comments   # Add comment
```

### Grocery
```
POST   /api/grocery/lists     # Create from recipes
GET    /api/grocery/lists     # Get lists
```

## Web Routes

```
/              # Home
/recipes       # Browse all
/recipes/[id]  # View recipe
/recipes/new   # Create recipe
/dashboard     # User dashboard
/login         # TODO
/signup        # TODO
```

## Environment Variables

### .env (API)
```
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
PORT=4000
```

### .env.local (Web)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## TypeScript Types (Key Ones)

```typescript
// From @repo/types
type UserRole = "viewer" | "creator" | "admin";
type RecipeDifficulty = "easy" | "medium" | "hard";

interface User { id, name, email, role, ... }
interface Recipe { id, title, ingredients[], steps[], ... }
interface Ingredient { name, quantity }
interface RecipeStep { stepNumber, instructionText, audioUrl }
```

## Testing

```bash
# Run all tests
turbo test

# Specific app
cd apps/api && pnpm test:watch

# E2E tests
cd apps/api && pnpm test:e2e
```

## Debugging

```bash
# API logs
DEBUG=* npm run dev

# Web DevTools
Press F12 in browser

# Database
pnpm db:studio
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Commit changes
git commit -m "feat: description"

# Format & lint before push
turbo format && turbo lint

# Push
git push origin feature/your-feature
```

## Performance Tips

- Use `pnpm` not npm (much faster)
- Enable turbo cache: `turbo cache status`
- Filter builds: `turbo build --filter=apps/api`
- Use `--force` to skip cache: `turbo build --force`

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| "Module not found" | `pnpm install` + `turbo build --force` |
| "Connection refused" | Check API running on 4000 |
| "CORS error" | Check CORS_ORIGIN in API .env |
| "DB connection error" | Check DATABASE_URL, ensure PostgreSQL running |
| "Port already in use" | Kill process: `lsof -i :4000` |

## Design System

- **Colors**: Tailwind defaults (gray, blue, red, etc.)
- **Typography**: Geist font
- **Components**: Shadcn UI (buttons, cards, inputs, etc.)
- **Spacing**: Tailwind scale (px, 2, 3, 4, 6, 8, etc.)
- **Breakpoints**: sm, md, lg (Tailwind defaults)

## Important Notes

1. **API runs on 4000**, Web on 3000 (don't change!)
2. **Database migrations are auto** (pnpm db:push)
3. **Types are shared** (update packages/types)
4. **NestJS decorators** are important (@Post, @Get, @UseGuards)
5. **Next.js client components** need "use client" at top
6. **Auth not fully implemented** yet (guards exist, needs JWT)

## Resources

- [NestJS Docs](https://docs.nestjs.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Drizzle Docs](https://orm.drizzle.team/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Turborepo Docs](https://turborepo.org/)

## Need Help?

1. Check GETTING_STARTED.md
2. Review similar code in codebase
3. Check error logs in terminal
4. Search GitHub issues
5. Ask team/community

---

**Last Updated**: 2024
**Project Status**: MVP in development
