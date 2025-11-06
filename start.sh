#!/bin/bash
set -e

echo "🚀 Starting AegisGuard services..."

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop."
  exit 1
fi

# Start Postgres and Redis
echo "📦 Starting Postgres and Redis..."
docker compose up -d postgres redis

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 5

# Create .env if it doesn't exist
if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cat > .env <<'EOF'
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aegis?schema=public
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=change-me-access-secret-12345
JWT_REFRESH_SECRET=change-me-refresh-secret-12345
ACCESS_TOKEN_TTL_MIN=5
REFRESH_TOKEN_TTL_DAYS=7
CORS_ORIGINS=http://localhost:5173
COOKIE_DOMAIN=localhost
WEBHOOK_SECRET=change-me-webhook-secret-12345
RATE_LIMIT_AUTH_PER_MIN=5
RATE_LIMIT_API_PER_MIN=60
EOF
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps || true
cd apps/api && npm install --legacy-peer-deps || true
cd ../web && npm install --legacy-peer-deps || true
cd ../..

# Setup Prisma
echo "🗄️  Setting up database..."
cd apps/api
npx prisma generate
npx prisma migrate dev --name init || true
npm run seed || true
cd ../..

# Start backend in background
echo "🔧 Starting API server..."
cd apps/api
npm run start:dev > ../../api.log 2>&1 &
API_PID=$!
cd ../..

# Wait for API to be ready
echo "⏳ Waiting for API to start..."
sleep 10

# Start frontend in background
echo "⚛️  Starting Web app..."
cd apps/web
npm run dev > ../../web.log 2>&1 &
WEB_PID=$!
cd ../..

echo ""
echo "✅ AegisGuard is running!"
echo ""
echo "📍 API: http://localhost:3000"
echo "📍 API Docs: http://localhost:3000/docs"
echo "📍 Web: http://localhost:5173"
echo ""
echo "📋 Default admin credentials:"
echo "   Email: admin@aegis.local"
echo "   Password: ChangeMeNow!123"
echo ""
echo "📊 Logs:"
echo "   API: tail -f api.log"
echo "   Web: tail -f web.log"
echo ""
echo "🛑 To stop: kill $API_PID $WEB_PID && docker compose down"
echo ""

# Save PIDs for cleanup
echo $API_PID > .api.pid
echo $WEB_PID > .web.pid

# Keep script running and tail logs
tail -f api.log web.log






