#!/bin/bash
set -e

echo "🛡️  AegisGuard - Complete Startup Script"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Docker
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Navigate to project root
cd "$(dirname "$0")"

# Kill any existing processes
echo "🧹 Cleaning up old processes..."
pkill -f "ts-node-dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

# Start Docker services
echo "🐳 Starting Postgres and Redis..."
docker compose up -d postgres redis
sleep 5

# Check Docker services
if ! docker ps | grep -q postgres; then
    echo -e "${RED}❌ Postgres failed to start${NC}"
    docker compose logs postgres
    exit 1
fi

echo -e "${GREEN}✅ Database services started${NC}"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install --legacy-peer-deps
fi

if [ ! -d "apps/api/node_modules" ]; then
    echo "📦 Installing API dependencies..."
    cd apps/api && npm install --legacy-peer-deps && cd ../..
fi

if [ ! -d "apps/web/node_modules" ]; then
    echo "📦 Installing Web dependencies..."
    cd apps/web && npm install --legacy-peer-deps && cd ../..
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Setup database
echo "🗄️  Setting up database..."
cd apps/api

# Create .env if it doesn't exist
if [ ! -f "../../.env" ]; then
    cat > ../../.env <<'EOF'
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
    echo -e "${GREEN}✅ Created .env file${NC}"
fi

# Source the env file
export $(cat ../../.env | xargs)

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate --schema ../../prisma/schema.prisma

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy --schema ../../prisma/schema.prisma || \
npx prisma migrate dev --name init --schema ../../prisma/schema.prisma --skip-seed

# Seed database
echo "Seeding database with admin user..."
cd ../..
node -e "
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function seed() {
  // Create permissions
  const perms = [
    'users:read', 'users:update', 'roles:manage', 
    'apikeys:manage', 'events:read', 'audit:read',
    'self:read', 'apikeys:self'
  ];
  
  for (const code of perms) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code }
    });
  }

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' }
  });

  await prisma.role.upsert({
    where: { name: 'ANALYST' },
    update: {},
    create: { name: 'ANALYST' }
  });

  await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: { name: 'USER' }
  });

  // Link all permissions to ADMIN role
  const allPerms = await prisma.permission.findMany();
  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      permissions: {
        set: allPerms.map(p => ({ id: p.id }))
      }
    }
  });

  // Create admin user
  const passwordHash = await argon2.hash('ChangeMeNow!123', { type: argon2.argon2id });
  
  await prisma.user.upsert({
    where: { email: 'admin@aegis.local' },
    update: {},
    create: {
      email: 'admin@aegis.local',
      passwordHash,
      roleId: adminRole.id
    }
  });

  console.log('✅ Seed complete');
  await prisma.\$disconnect();
}

seed().catch(e => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
"

echo -e "${GREEN}✅ Database ready${NC}"
echo ""

# Start API server
echo "🚀 Starting API server..."
cd apps/api
npm run start:dev > ../../logs/api.log 2>&1 &
API_PID=$!
echo $API_PID > ../../.api.pid
cd ../..

echo "⏳ Waiting for API to start..."
for i in {1..30}; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API server is running!${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ API failed to start. Check logs/api.log${NC}"
        exit 1
    fi
done

# Start Web server
echo "🌐 Starting Web server..."
cd apps/web
npm run dev > ../../logs/web.log 2>&1 &
WEB_PID=$!
echo $WEB_PID > ../../.web.pid
cd ../..

echo "⏳ Waiting for Web server..."
for i in {1..20}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Web server is running!${NC}"
        break
    fi
    sleep 1
done

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 AegisGuard is now running!${NC}"
echo "=========================================="
echo ""
echo "📍 Web UI:      http://localhost:5173"
echo "📍 API:         http://localhost:3000"
echo "📍 API Docs:    http://localhost:3000/docs"
echo ""
echo "📧 Admin Login:"
echo "   Email:    admin@aegis.local"
echo "   Password: ChangeMeNow!123"
echo ""
echo "📊 View logs:"
echo "   API:  tail -f logs/api.log"
echo "   Web:  tail -f logs/web.log"
echo ""
echo "🛑 To stop everything:"
echo "   kill \$(cat .api.pid) \$(cat .web.pid)"
echo "   docker compose down"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop and view logs...${NC}"
echo ""

# Create logs directory
mkdir -p logs

# Tail both logs
tail -f logs/api.log logs/web.log

