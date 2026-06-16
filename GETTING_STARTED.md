# Cooksy - Getting Started Guide

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment

Create `.env` files:

**apps/api/.env**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/cooksy
OPENAI_API_KEY=sk-YOUR_KEY_HERE
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

**apps/web/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Setup Database

```bash
cd packages/db
pnpm db:push  # Create tables
pnpm db:seed  # Optional: add sample data
cd ../..
```

### 4. Start Development Servers

**In 4 separate terminal windows:**

```bash
# Terminal 1: API
cd apps/api && pnpm dev

# Terminal 2: Web
cd apps/web && pnpm dev

# Terminal 3 (optional): Watch builds
turbo build --watch

# Terminal 4 (optional): Mobile
cd apps/mobile && pnpm start
```

Visit:
- **Web**: http://localhost:3000
- **API**: http://localhost:4000/api

## Project Organization

### Core Apps

#### `apps/api` - NestJS REST API
- Handles all business logic
- Integrates with OpenAI for AI features
- Manages database operations
- Provides endpoints for web/mobile apps

**Key modules:**
- `auth/` - User authentication & profiles
- `recipes/` - Recipe CRUD & search
- `ai/` - AI structuring, TTS, ingredient normalization
- `social/` - Likes, comments, ratings
- `grocery/` - Grocery list management

#### `apps/web` - Next.js 16 Frontend
- Server-side rendering for SEO
- Real-time UI with React
- Authentication flow
- Recipe creation workflow

**Key pages:**
- `/` - Homepage
- `/recipes` - Browse recipes with filters
- `/recipes/[id]` - Recipe detail view
- `/recipes/new` - Create recipe (AI-powered)
- `/dashboard` - User dashboard

#### `apps/mobile` - React Native (Expo)
- Cross-platform mobile app
- Voice recording for recipes
- Cooking mode with TTS
- Offline support planned

### Shared Packages

#### `packages/db`
- PostgreSQL schema with Drizzle ORM
- Type-safe database operations
- Migration system

```bash
# Common commands
pnpm db:generate  # Generate types from schema
pnpm db:migrate   # Run migrations
pnpm db:push      # Sync schema with DB
pnpm db:studio    # Open Drizzle Studio
```

#### `packages/ai`
- OpenAI API client
- AI prompts for recipe structuring
- TTS configuration

#### `packages/types`
- Shared TypeScript interfaces
- Ensures consistency across apps

#### `packages/ui`
- Reusable React components
- Built with Shadcn UI

## Common Tasks

### Add a New API Endpoint

1. **Create controller method** in `apps/api/src/[module]/[module].controller.ts`
2. **Add service logic** in `apps/api/src/[module]/[module].service.ts`
3. **Add DTO** in `apps/api/src/[module]/dto/[name].dto.ts`
4. **Test** with your client

Example:
```typescript
// controller
@Post('endpoint')
async myEndpoint(@Body() dto: MyDto) {
  return this.service.method(dto);
}

// service
async method(dto: MyDto) {
  // Business logic
  return result;
}
```

### Use API in Web App

```typescript
// lib/api.ts already has many helpers
import { api } from '@/lib/api';

// In component:
const recipes = await api.getRecipes({
  search: 'pasta',
  difficulty: 'easy'
});
```

### Add Database Table

1. **Edit schema** in `packages/db/src/schema/`
2. **Generate migration**:
   ```bash
   cd packages/db
   pnpm db:generate
   ```
3. **Push to database**:
   ```bash
   pnpm db:push
   ```

### Debug

**API:**
```bash
# Enable verbose logging
DEBUG=* npm run dev
```

**Web:**
```bash
# Open browser DevTools (F12)
# Check Network and Console tabs
```

**Database:**
```bash
# Open Drizzle Studio
cd packages/db && pnpm db:studio
# Visit http://localhost:5555
```

## Testing

```bash
# Run all tests
turbo test

# Test specific app
cd apps/api && pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## Deployment

### API (Node.js)
```bash
# Build
turbo build

# Run
node apps/api/dist/main.js
```

### Web (Next.js)
```bash
# Build
cd apps/web && pnpm build

# Start
pnpm start
```

Deploy to: Vercel (web), Railway/Render/DigitalOcean (API)

## Environment Variables Reference

### API Variables
| Variable | Required | Example |
|----------|----------|---------|
| DATABASE_URL | ✅ | postgresql://user:pass@localhost/cooksy |
| OPENAI_API_KEY | ✅ | sk-... |
| CORS_ORIGIN | ⚠️ | http://localhost:3000 |
| NODE_ENV | ⚠️ | development |
| PORT | ⚠️ | 4000 |

### Web Variables
| Variable | Required | Example |
|----------|----------|---------|
| NEXT_PUBLIC_API_URL | ✅ | http://localhost:4000 |

## Troubleshooting

### "Module not found" errors
```bash
# Reinstall dependencies
pnpm install

# Clear turbo cache
turbo prune --docker
```

### Database connection fails
```bash
# Check PostgreSQL is running
psql -U postgres -h localhost

# Verify DATABASE_URL is correct
# Format: postgresql://user:password@host:port/database
```

### API returns 404
- Check API is running: `curl http://localhost:4000/api`
- Verify controller has the route
- Check error logs in terminal

### Web doesn't connect to API
- Check `NEXT_PUBLIC_API_URL` is set correctly
- Verify API CORS_ORIGIN includes your web URL
- Check API is running and accessible

### TypeScript errors
```bash
# Rebuild types
turbo build --force

# Check specific file
pnpm tsc --noEmit
```

## Architecture Decisions

### Why Turborepo?
- Share code between apps (types, UI, config)
- Monorepo simplifies dependency management
- Single source of truth for schemas

### Why NestJS for API?
- TypeScript-first
- Excellent for scalable backends
- Built-in dependency injection
- Great ORM support

### Why Next.js for Web?
- Server-side rendering (SEO)
- Built-in API routes
- File-based routing
- Excellent DX

### Why Drizzle ORM?
- Type-safe SQL
- TypeScript-first design
- Better performance than higher-level ORMs
- Excellent migration system

## Next Steps

After setting up:

1. **Explore the codebase** - Read through existing modules
2. **Create a test recipe** - Use the `/recipes/new` flow
3. **Check API docs** - Review controller methods
4. **Run the tests** - Get familiar with the test setup
5. **Start developing** - Pick a feature to build!

## Resources

- [NestJS Docs](https://docs.nestjs.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Drizzle Docs](https://orm.drizzle.team/docs/overview)
- [OpenAI API](https://platform.openai.com/docs)
- [Turborepo Docs](https://turborepo.org/docs)

## Getting Help

1. Check this guide
2. Review similar existing code
3. Check error logs in terminal
4. Ask in team chat/Discord

Happy cooking! 🍳
