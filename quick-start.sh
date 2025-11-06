#!/bin/bash

echo "🚀 AegisGuard Quick Start"
echo "=========================="
echo ""

# Check Docker
echo "Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop."
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Navigate to project root
cd "$(dirname "$0")"

# Start databases
echo "📦 Starting PostgreSQL and Redis..."
docker compose up -d postgres redis

echo "⏳ Waiting 8 seconds for databases to initialize..."
sleep 8

# Check if containers are running
if ! docker ps | grep -q postgres; then
    echo "❌ PostgreSQL failed to start"
    docker compose logs postgres
    exit 1
fi

if ! docker ps | grep -q redis; then
    echo "❌ Redis failed to start"
    docker compose logs redis
    exit 1
fi

echo "✅ Databases started"
echo ""

# Create .env if missing
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env <<'EOF'
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aegis?schema=public
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=change-me-access-secret-very-long-12345
JWT_REFRESH_SECRET=change-me-refresh-secret-very-long-12345
ACCESS_TOKEN_TTL_MIN=5
REFRESH_TOKEN_TTL_DAYS=7
CORS_ORIGINS=http://localhost:5173
COOKIE_DOMAIN=localhost
WEBHOOK_SECRET=change-me-webhook-secret-very-long-12345
RATE_LIMIT_AUTH_PER_MIN=5
RATE_LIMIT_API_PER_MIN=60
EOF
    echo "✅ Created .env"
fi

# Install root dependencies
echo ""
echo "📦 Installing root dependencies..."
npm install --legacy-peer-deps > /dev/null 2>&1 || npm install > /dev/null 2>&1

# Install API dependencies
echo "📦 Installing API dependencies..."
cd apps/api
npm install --legacy-peer-deps > /dev/null 2>&1 || npm install > /dev/null 2>&1

# Setup Prisma
echo "🗄️  Setting up Prisma..."
cd ../..
npx prisma generate --schema prisma/schema.prisma

echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init --schema prisma/schema.prisma --skip-generate || true

echo "🌱 Seeding database..."
npx ts-node prisma/seed.ts || node -r ts-node/register prisma/seed.ts

# Install web dependencies
echo "📦 Installing Web dependencies..."
cd apps/web
npm install --legacy-peer-deps > /dev/null 2>&1 || npm install > /dev/null 2>&1
cd ../..

echo ""
echo "✅ Setup complete!"
echo ""
echo "=========================="
echo "NOW FOLLOW THESE STEPS:"
echo "=========================="
echo ""
echo "1️⃣  Open a NEW terminal and run:"
echo "   cd /Users/mauritz/projects/aegisguard/apps/api && npm run start:dev"
echo ""
echo "2️⃣  Wait for 'API listening on http://localhost:3000'"
echo ""
echo "3️⃣  Open ANOTHER NEW terminal and run:"
echo "   cd /Users/mauritz/projects/aegisguard/apps/web && npm run dev"
echo ""
echo "4️⃣  Wait for 'Local: http://localhost:5173/'"
echo ""
echo "5️⃣  Open your browser to: http://localhost:5173"
echo ""
echo "📧 Login: admin@aegis.local"
echo "🔑 Password: ChangeMeNow!123"
echo ""






