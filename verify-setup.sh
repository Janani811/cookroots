#!/bin/bash
# Cooksy Setup Verification Script
# Run this to verify everything is set up correctly

echo "🍳 Cooksy Setup Verification"
echo "=============================="
echo ""

# Check Node version
echo "✓ Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "  Node.js version: $NODE_VERSION"
    if [[ $NODE_VERSION == v1[89]* ]] || [[ $NODE_VERSION == v2* ]]; then
        echo "  ✅ Node.js 18+ detected"
    else
        echo "  ⚠️  Node.js 18+ recommended (you have $NODE_VERSION)"
    fi
else
    echo "  ❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

echo ""

# Check pnpm
echo "✓ Checking pnpm..."
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm -v)
    echo "  pnpm version: $PNPM_VERSION"
    echo "  ✅ pnpm is installed"
else
    echo "  ⚠️  pnpm not found. Installing..."
    npm install -g pnpm
fi

echo ""

# Check dependencies
echo "✓ Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "  ✅ node_modules found"
else
    echo "  ⚠️  node_modules not found. Run: pnpm install"
fi

echo ""

# Check database setup
echo "✓ Checking database..."
if [ -f ".env" ] || [ -f "apps/api/.env" ]; then
    echo "  ✅ .env file found"
    if grep -q "DATABASE_URL" apps/api/.env 2>/dev/null; then
        echo "  ✅ DATABASE_URL configured"
    else
        echo "  ⚠️  DATABASE_URL not set in .env"
    fi
else
    echo "  ⚠️  .env file not found. Create one based on .env.example"
fi

echo ""

# Check web config
echo "✓ Checking web app..."
if [ -f "apps/web/.env.local" ]; then
    echo "  ✅ .env.local found"
    if grep -q "NEXT_PUBLIC_API_URL" apps/web/.env.local 2>/dev/null; then
        echo "  ✅ NEXT_PUBLIC_API_URL configured"
    fi
else
    echo "  ⚠️  apps/web/.env.local not found"
fi

echo ""

# Check git
echo "✓ Checking git..."
if [ -d ".git" ]; then
    echo "  ✅ Git repository found"
else
    echo "  ⚠️  Not a git repository"
fi

echo ""
echo "=============================="
echo "📋 Setup Checklist:"
echo "=============================="
echo ""
echo "Before running the app:"
echo "  [ ] Run: pnpm install"
echo "  [ ] Setup PostgreSQL database"
echo "  [ ] Create .env file (copy from .env.example)"
echo "  [ ] Create apps/web/.env.local (copy from .env.example)"
echo "  [ ] Run: cd packages/db && pnpm db:push"
echo ""
echo "To run the app:"
echo "  Terminal 1: cd apps/api && pnpm dev"
echo "  Terminal 2: cd apps/web && pnpm dev"
echo ""
echo "Then visit:"
echo "  Web:  http://localhost:3000"
echo "  API:  http://localhost:4000/api"
echo ""
echo "📚 Documentation:"
echo "  • GETTING_STARTED.md - Setup guide"
echo "  • DEV_CHEATSHEET.md - Quick commands"
echo "  • ROADMAP.md - Feature checklist"
echo ""
echo "✅ Verification complete!"
