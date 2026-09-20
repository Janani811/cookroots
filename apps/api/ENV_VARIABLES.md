# Environment Variables Guide

## Required Variables (Must Have)

### `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- **Description**: Discrete PostgreSQL connection credentials, used to build a `pg` connection pool (see `packages/db/src/config/database.config.ts`)
- **Example**: `DB_HOST=localhost`, `DB_PORT=5432`, `DB_NAME=cookroots`, `DB_USER=postgres`, `DB_PASSWORD=mypassword`
- **SSL**: enabled automatically when `NODE_ENV=production` (needed for managed Postgres like Neon/Supabase)
- **How to get**:
  1. Install PostgreSQL
  2. Create a database: `createdb cookroots`
  3. Use its host/port/name/user/password (or the values from your managed Postgres provider)

### `GEMINI_API_KEY`
- **Description**: Google Gemini API key for AI features (recipe structuring, health classification, voice transcription)
- **How to get**:
  1. Go to https://aistudio.google.com/apikey
  2. Create an API key
  3. Copy the key

### `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **Description**: Cloudinary credentials for image uploads (avatars, recipe photos, tried-it photos)
- **How to get**:
  1. Sign up free at https://cloudinary.com (no card required)
  2. Copy Cloud Name, API Key, and API Secret from your dashboard

## Required for Development

### `CORS_ORIGIN`
- **Description**: Allowed origins for CORS requests
- **Development**: `http://localhost:3000,http://localhost:3001`
- **Production**: `https://yourdomain.com,https://www.yourdomain.com`
- **Note**: Comma-separated list, no spaces

### `PORT` (Optional)
- **Description**: Server port
- **Default**: `4000`
- **Example**: `4000`

### `NODE_ENV` (Optional)
- **Description**: Environment mode
- **Options**: `development`, `production`, `staging`
- **Default**: `development`

---

## Optional Variables (Nice to Have)

### `JWT_SECRET`
- **Description**: Secret key for JWT token signing
- **When needed**: When implementing token-based auth
- **Example**: Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### `JWT_EXPIRES_IN`
- **Description**: JWT token expiration time
- **Default**: `7d`
- **Options**: `24h`, `7d`, `30d`, etc.

### `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- **Description**: SMTP credentials used by nodemailer to send password reset emails
- **When needed**: For real email delivery. Without all four set, forgot-password falls back to dev mode — the reset link is returned directly in the API response instead of being emailed
- **Notes**: `SMTP_PORT=465` is treated as implicit TLS; any other port uses STARTTLS. For Gmail, use `smtp.gmail.com`, port `587`, and an [app password](https://myaccount.google.com/apppasswords) (not your account password)

### `EMAIL_FROM`
- **Description**: The "from" address used for password reset emails
- **Default**: falls back to `SMTP_USER`, then `no-reply@cookroots.app`

### `WEB_URL`
- **Description**: Base URL of the web app, used to build password reset links (e.g. `${WEB_URL}/reset-password?token=...`)
- **Default**: `http://localhost:3000`

---

## Setup Steps

### 1. Create .env File

```bash
cd apps/api
cp .env.example .env
```

### 2. Fill in Required Variables

Edit `apps/api/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cookroots
DB_USER=postgres
DB_PASSWORD=password
GEMINI_API_KEY=your-gemini-key-here
CORS_ORIGIN=http://localhost:3000
PORT=4000
NODE_ENV=development
```

### 3. Test Connection

```bash
cd apps/api
pnpm dev
```

Should see: `🚀 Server running on http://localhost:4000`

---

## Quick Setup Checklist

- [ ] Create PostgreSQL database
- [ ] Get Gemini API key
- [ ] Create `apps/api/.env` from `.env.example`
- [ ] Fill in `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` and `GEMINI_API_KEY`
- [ ] Test with `pnpm dev`

---

## Troubleshooting

### "Connection refused" / pool fails to connect
```bash
# Make sure apps/api/.env exists with DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD set
```

### "Connection refused" (Database)
```bash
# Check if PostgreSQL is running
psql -U postgres

# If not running, start it:
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### "Invalid API key" (Gemini)
- Visit https://aistudio.google.com/apikey
- Regenerate key if expired

### "CORS error" in browser
- Check `CORS_ORIGIN` includes your frontend URL
- Restart API server after changing .env
- Frontend must be on exact URL (port matters)

---

## Environment by Stage

### Development (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cookroots
DB_USER=postgres
DB_PASSWORD=password
GEMINI_API_KEY=your-gemini-test-key
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
NODE_ENV=development
PORT=4000
```

### Production (.env.production)
```env
DB_HOST=prod.db.host
DB_PORT=5432
DB_NAME=cookroots
DB_USER=user
DB_PASSWORD=secure
GEMINI_API_KEY=your-gemini-prod-key
CORS_ORIGIN=https://cookroots.com,https://www.cookroots.com
NODE_ENV=production
PORT=4000
JWT_SECRET=your-secret-key
```

### Staging (.env.staging)
```env
DB_HOST=staging.db.host
DB_PORT=5432
DB_NAME=cookroots
DB_USER=user
DB_PASSWORD=password
GEMINI_API_KEY=your-gemini-staging-key
CORS_ORIGIN=https://staging.cookroots.com
NODE_ENV=staging
PORT=4000
```

---

## Security Notes

- ✅ `.env` is in `.gitignore` (never commit!)
- ✅ Use a strong `DB_PASSWORD`
- ✅ Rotate API keys periodically
- ✅ Don't share .env files
- ✅ Use environment variables on hosting (Vercel, Railway, etc.)

---

## Docker/Container Setup

If using Docker, pass env variables at runtime:

```bash
docker run \
  -e DB_HOST=db \
  -e DB_PORT=5432 \
  -e DB_NAME=cookroots \
  -e DB_USER=postgres \
  -e DB_PASSWORD=password \
  -e GEMINI_API_KEY=... \
  cookroots-api
```

Or in `docker-compose.yml`:

```yaml
services:
  api:
    environment:
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: cookroots
      DB_USER: postgres
      DB_PASSWORD: password
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      CORS_ORIGIN: http://localhost:3000
```

---

## Need Help?

See `GETTING_STARTED.md` for full setup guide.
