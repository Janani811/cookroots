# 🍳 Cooksy - Voice-First Recipe Platform

**Cooksy** is a community recipe platform that uses AI to structure messy cooking instructions into clear, formatted recipes. Share your cooking videos, record voice instructions, and get AI-powered recipe formatting with hands-free cooking mode.

## Features

✨ **AI-Powered Recipe Structuring**
- Turn voice notes, messy instructions, or plain text into properly formatted recipes
- Automatic ingredient parsing and normalization
- Intelligent step extraction and timing estimation

🎙️ **Voice-First**
- Record cooking instructions directly
- Text-to-speech guidance during cooking
- Hands-free step-by-step walkthrough

👨‍🍳 **Cooking Mode**
- Hands-free step playback with TTS
- Ingredient checklist
- Timer management

🤝 **Community Features**
- Like and comment on recipes
- Share your culinary creations
- Browse thousands of community recipes
- Ingredient-based recipe discovery

## Project Structure

This is a **Turborepo monorepo** with the following structure:

```
cooksy/
├── apps/
│   ├── api/          # NestJS REST API (port 4000)
│   ├── web/          # Next.js 16 web app (port 3000)
│   ├── mobile/       # React Native/Expo mobile app
│   └── backend/      # (Legacy/Unused)
├── packages/
│   ├── ai/           # OpenAI client & prompts
│   ├── db/           # Drizzle ORM + PostgreSQL schema
│   ├── types/        # Shared TypeScript types
│   ├── ui/           # Shared React components
│   ├── eslint-config/
│   └── typescript-config/
```

## Tech Stack

**Backend:**
- [NestJS](https://nestjs.com/) - REST API framework
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe SQL
- [OpenAI](https://openai.com/) - AI integration

**Frontend:**
- [Next.js 16](https://nextjs.org/) - React framework (web)
- [React Native](https://reactnative.dev/) - Mobile app
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Shadcn UI](https://ui.shadcn.com/) - Component library

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- PostgreSQL database
- OpenAI API key

### 1. Install Dependencies

```sh
pnpm install
```

### 2. Set Up Environment Variables

**API (.env):**
```bash
# apps/api/.env
DATABASE_URL=postgresql://user:password@localhost:5432/cooksy
OPENAI_API_KEY=sk-...
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
PORT=4000
```

**Web (.env.local):**
```bash
# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Set Up Database

```sh
cd packages/db
pnpm db:push
```

### 4. Run in Development

Open 4 terminals:

**Terminal 1: API**
```sh
cd apps/api
pnpm dev
# Runs on http://localhost:4000
```

**Terminal 2: Web**
```sh
cd apps/web
pnpm dev
# Runs on http://localhost:3000
```

**Terminal 3: Mobile (optional)**
```sh
cd apps/mobile
pnpm start
```

**Terminal 4: Watch TypeScript**
```sh
turbo build --watch
```

## Key APIs

### Recipe Management
- `GET /api/recipes` - List recipes (search, filter by difficulty)
- `POST /api/recipes` - Create recipe
- `GET /api/recipes/:id` - Get recipe detail
- `DELETE /api/recipes/:id` - Delete recipe

### AI Features
- `POST /api/ai/structure` - Structure text/audio into recipe
- `POST /api/ai/improve` - Improve recipe suggestions
- `POST /api/ai/tts` - Generate step audio (text-to-speech)
- `POST /api/ai/normalize-ingredients` - Normalize ingredient names

### Social
- `POST /api/social/likes` - Like recipe
- `DELETE /api/social/likes/:id` - Unlike recipe
- `GET /api/social/comments` - Get comments
- `POST /api/social/comments` - Add comment

### Grocery
- `POST /api/grocery/lists` - Create grocery list from recipes
- `GET /api/grocery/lists` - Get user's lists

## Development Commands

```sh
# Build all apps
turbo build

# Run tests
turbo test

# Lint all code
turbo lint

# Format code
turbo format

# Dev server for all apps
turbo dev
```

## Web App Pages

- `/` - Homepage with features
- `/recipes` - Browse all recipes (with search/filter)
- `/recipes/:id` - Recipe detail view
- `/recipes/new` - Create new recipe (3-step flow)
- `/dashboard` - User dashboard & recipe management

## Features Implemented

### ✅ Complete
- Recipe CRUD operations
- AI structuring from text/audio
- Search & filtering recipes
- Comments & likes system
- Grocery list creation
- Full web UI for all features
- Authentication guards (API ready)

### 🚧 In Progress
- User authentication integration
- File upload for audio/images
- Cooking mode with TTS playback
- Mobile app implementation

## Database Schema

See [packages/db/src/schema](packages/db/src/schema) for full schema. Key tables:

- `users` - User accounts & roles
- `recipes` - Recipe metadata
- `recipe_steps` - Cooking instructions
- `recipe_ingredients` - Ingredients
- `recipe_likes` - Social engagement
- `recipe_comments` - Community discussion
- `grocery_lists` - User grocery lists

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `turbo test` and `turbo lint`
4. Submit a PR

## License

MIT
npm dlx turbo build
npm exec turbo build
```

You can build a specific package by using a [filter](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters):

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed:

```sh
turbo build --filter=docs
```

Without global `turbo`:

```sh
npx turbo build --filter=docs
npm exec turbo build --filter=docs
npm exec turbo build --filter=docs
```

### Develop

To develop all apps and packages, run the following command:

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended):

```sh
cd my-turborepo
turbo dev
```

Without global `turbo`, use your package manager:

```sh
cd my-turborepo
npx turbo dev
npm exec turbo dev
npm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters):

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed:

```sh
turbo dev --filter=web
```

Without global `turbo`:

```sh
npx turbo dev --filter=web
npm exec turbo dev --filter=web
npm exec turbo dev --filter=web
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended):

```sh
cd my-turborepo
turbo login
```

Without global `turbo`, use your package manager:

```sh
cd my-turborepo
npx turbo login
npm exec turbo login
npm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed:

```sh
turbo link
```

Without global `turbo`:

```sh
npx turbo link
npm exec turbo link
npm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.dev/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.dev/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.dev/docs/reference/configuration)
- [CLI Usage](https://turborepo.dev/docs/reference/command-line-reference)
