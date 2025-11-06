# 🚀 Observability Platform - Quick Start Guide

## 📋 Prerequisites

- ✅ Node.js 18+ & npm
- ✅ Docker & Docker Compose
- ✅ PostgreSQL client (`psql`)
- ✅ Git

---

## ⚡ Quick Start (5 minutes)

### **Step 1: Clone & Install**

```bash
cd /Users/mauritz/projects/aegisguard

# Install backend dependencies
cd apps/api
npm install

# Install frontend dependencies  
cd ../web
npm install

cd ../..
```

### **Step 2: Configure Environment**

Create `.env` in project root:

```bash
# Copy template
cat > .env << 'EOF'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aegis"
CLICKHOUSE_HOST="http://localhost:8123"
CLICKHOUSE_DATABASE="observability"
CLICKHOUSE_USER="aegis"
CLICKHOUSE_PASSWORD="aegis_ch_pass"
TIMESCALE_HOST="localhost"
TIMESCALE_PORT=5433
TIMESCALE_DATABASE="metrics"
TIMESCALE_USER="aegis"
TIMESCALE_PASSWORD="aegis_ts_pass"
REDIS_HOST="localhost"
REDIS_PORT=6379
JWT_SECRET="dev-secret-change-in-production-12345678901234567890"
NORMALIZER_ENABLED="true"
CORS_ORIGIN="http://localhost:5173,http://127.0.0.1:5173"
NODE_ENV="development"
PORT=3000
EOF
```

### **Step 3: Start Docker Services**

```bash
# Start PostgreSQL, Redis, ClickHouse, TimescaleDB
docker-compose up -d

# Wait for services to be ready (30 seconds)
sleep 30

# Verify
docker ps
```

### **Step 4: Run Database Migrations**

```bash
# Generate Prisma client
npx prisma generate --schema prisma/schema.prisma

# Run migrations
npx prisma migrate dev --name init_observability --schema prisma/schema.prisma

# Seed users & roles
npx ts-node prisma/seed.ts

# Seed organizations & API keys
npx ts-node prisma/seed-organizations.ts
```

**📝 Save the API credentials** printed by `seed-organizations.ts`!

### **Step 5: Start Backend**

```bash
cd apps/api
npm run start:dev
```

You should see:
```
✅ ClickHouse connected successfully
✅ TimescaleDB connected successfully  
✅ Redis Streams connected successfully
🚀 Starting Normalizer Worker (ID: normalizer-...)
✅ Normalizer Worker started
🚀 API listening on http://localhost:3000
```

### **Step 6: Start Frontend**

In a new terminal:

```bash
cd /Users/mauritz/projects/aegisguard/apps/web
npm run dev
```

Frontend: **http://localhost:5173**

---

## 🧪 Test Ingestion

### **Option 1: Using curl**

```bash
# From seed output, copy the secret
SECRET="<your-secret-from-seed>"

# Create payload
BODY='{"logs":[{"timestamp":"2025-10-31T12:00:00Z","service":"api","level":"info","message":"Hello from AegisGuard!","attributes":{"user_id":"123","request_id":"abc"}}]}'

# Generate HMAC signature
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

# Send request
curl -X POST http://localhost:3000/v1/logs \
  -H "Content-Type: application/json" \
  -H "x-org-key: obs_dev123" \
  -H "x-signature: sha256=$SIGNATURE" \
  -H "x-timestamp: $(date +%s)000" \
  -d "$BODY"
```

**Expected Response:**
```json
{
  "success": true,
  "accepted": 1,
  "message": "Logs accepted for processing"
}
```

### **Option 2: Using the test script**

Create `test-ingest.sh`:

```bash
#!/bin/bash

SECRET="<your-secret>"
ORG_KEY="obs_dev123"
API_URL="http://localhost:3000"

# Test Logs
BODY='{"logs":[{"service":"api","level":"info","message":"Test log entry"}]}'
SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')
curl -X POST $API_URL/v1/logs \
  -H "Content-Type: application/json" \
  -H "x-org-key: $ORG_KEY" \
  -H "x-signature: sha256=$SIG" \
  -d "$BODY"

echo -e "\n✅ Logs ingested"

# Test Metrics
BODY='{"metrics":[{"name":"http_requests_total","value":42,"labels":{"service":"api","method":"GET"}}]}'
SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')
curl -X POST $API_URL/v1/metrics \
  -H "Content-Type: application/json" \
  -H "x-org-key: $ORG_KEY" \
  -H "x-signature: sha256=$SIG" \
  -d "$BODY"

echo -e "\n✅ Metrics ingested"
```

---

## 🔍 Query Data

### **1. Login to Dashboard**

1. Open **http://localhost:5173/login**
2. Login with:
   - Email: `admin@example.com`
   - Password: `Admin123!`

### **2. Query Logs via API**

```bash
# Get JWT token
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}' \
  | jq -r '.accessToken')

# Search logs
curl -X POST http://localhost:3000/query/logs/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "start": "2025-10-30T00:00:00Z",
    "end": "2025-11-01T00:00:00Z",
    "service": "api",
    "limit": 10
  }' | jq
```

### **3. Query Metrics**

```bash
curl -X POST http://localhost:3000/query/metrics \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "avg(http_requests_total{service=\"api\"})",
    "start": "2025-10-30T00:00:00Z",
    "end": "2025-11-01T00:00:00Z",
    "step": "5m"
  }' | jq
```

---

## 🔧 Verify Services

### **PostgreSQL**
```bash
psql postgresql://postgres:postgres@localhost:5432/aegis -c "SELECT COUNT(*) FROM \"User\";"
```

### **ClickHouse**
```bash
curl "http://localhost:8123/?query=SELECT%20COUNT(*)%20FROM%20observability.logs"
```

### **TimescaleDB**
```bash
PGPASSWORD=aegis_ts_pass psql -h localhost -p 5433 -U aegis -d metrics -c "SELECT COUNT(*) FROM metrics;"
```

### **Redis**
```bash
redis-cli ping
redis-cli XINFO STREAM logs:raw
```

---

## 📊 Database Schemas

### **ClickHouse Tables**
- `observability.logs` - Log entries
- `observability.spans` - Distributed trace spans
- `observability.rum_events` - Real User Monitoring events
- `observability.logs_agg_hourly` - Hourly log aggregates (materialized view)
- `observability.spans_agg_hourly` - Hourly span latencies (materialized view)

### **TimescaleDB Tables**
- `metrics` - Time-series metrics (hypertable)
- `metrics_1m` - 1-minute rollups (continuous aggregate)
- `metrics_5m` - 5-minute rollups (continuous aggregate)
- `metrics_1h` - 1-hour rollups (continuous aggregate)

### **PostgreSQL Tables**
- `Organization` - Multi-tenant organizations
- `OrganizationUser` - User-org memberships
- `Monitor` - Alerting rules
- `SLO` - Service Level Objectives
- `Alert` - Fired alerts
- `UsageDaily` - Daily usage metrics per org
- `IngestIdempotency` - Idempotency key cache

---

## 🐛 Troubleshooting

### **Issue: "ClickHouse connection failed"**
```bash
# Check if ClickHouse is running
docker ps | grep clickhouse

# Check logs
docker logs aegis-clickhouse

# Restart
docker-compose restart clickhouse
```

### **Issue: "Normalizer Worker not starting"**
```bash
# Check Redis
redis-cli ping

# Check logs
cd apps/api && npm run start:dev
# Look for "✅ Redis Streams connected"
```

### **Issue: "Logs not appearing in ClickHouse"**
```bash
# Check Redis Streams
redis-cli XLEN logs:raw
# Should show messages if ingestion is working

# Check normalizer is processing
redis-cli XINFO GROUPS logs:raw
# Look for 'pending' count (should be low)

# Check ClickHouse directly
curl "http://localhost:8123/?query=SELECT%20COUNT(*)%20FROM%20observability.logs"
```

### **Issue: "Invalid signature"**
```bash
# Verify secret matches
# Check prisma/seed-organizations.ts output

# Test signature generation
echo -n '{"test":true}' | openssl dgst -sha256 -hmac "your_secret"
```

---

## 🔥 Load Testing

### **Generate 1000 logs**
```bash
for i in {1..1000}; do
  BODY="{\"logs\":[{\"service\":\"load-test\",\"level\":\"info\",\"message\":\"Log $i\"}]}"
  SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')
  curl -X POST http://localhost:3000/v1/logs \
    -H "Content-Type: application/json" \
    -H "x-org-key: obs_dev123" \
    -H "x-signature: sha256=$SIG" \
    -d "$BODY" &
done
wait

echo "✅ Sent 1000 logs"
```

### **Monitor Processing**
```bash
# Watch Redis Streams
watch -n 1 'redis-cli XLEN logs:raw'

# Watch ClickHouse ingestion
watch -n 1 'curl -s "http://localhost:8123/?query=SELECT%20COUNT(*)%20FROM%20observability.logs"'
```

---

## 🎯 Next Steps

1. ✅ **Backend is ready!** (Phases 1-4 complete)
2. 🚧 **Build Frontend UI** (Phase 5):
   - Logs Explorer
   - Metrics Dashboard
   - Traces Waterfall
   - RUM Dashboard
3. 📊 **Add Monitors & Alerting**
4. 🎨 **Build SLO Dashboard**
5. 💰 **Usage & Billing UI**

---

## 📚 API Documentation

Once running, visit:
- **Swagger UI:** http://localhost:3000/api
- **Health Check:** http://localhost:3000/health

---

## 🛑 Stop Services

```bash
# Stop backend
# Ctrl+C in terminal

# Stop Docker
docker-compose down

# Stop frontend
# Ctrl+C in terminal
```

---

## 🗑️ Clean Up

```bash
# Remove all data (WARNING: irreversible!)
docker-compose down -v
rm -rf apps/api/dist
rm prisma/migrations/*
```

---

**🎉 You're all set! Start ingesting observability data!**

For detailed documentation, see `OBSERVABILITY_PHASES_1-4_COMPLETE.md`





