# AegisGuard — Full-Stack Observability & Security Platform

A production-grade, Datadog-style observability platform with enterprise security features. Complete monitoring solution for logs, metrics, traces, and Real User Monitoring (RUM) with multi-tenant isolation.

## One-liner
Full-stack observability platform with secure ingestion, real-time analysis, and comprehensive security controls: logs, metrics, traces, RUM, monitors, SLOs, auth + MFA, RBAC, API keys, audit logs, and usage tracking.

## Goals
- **Observability**: Complete telemetry platform (logs, metrics, traces, RUM) with Datadog-style UI
- **Security**: Enterprise-grade security with MFA, RBAC, HMAC verification, PII scrubbing
- **Multi-tenant**: Organization-level isolation with secure ingestion and query APIs
- **Production-ready**: Background workers, rate limiting, columnar storage, time-series DB
- **Developer Experience**: OpenAPI docs, React admin UI, TypeScript throughout

## Non-goals
- Perfect design polish.
- Multi-cloud IaC (keep Compose + GitHub Actions).

## Tech Stack

### **Observability Platform**
- **Ingestion**: NestJS REST API with HMAC signature verification, rate limiting, idempotency
- **Processing**: Redis Streams message queue, background workers with PII scrubbing & enrichment
- **Storage**: 
  - ClickHouse (columnar) for logs, traces, and RUM events
  - TimescaleDB (time-series) for metrics with continuous aggregates
  - PostgreSQL for metadata, users, orgs, and usage tracking
- **Query**: LogQL-lite for logs, PromQL-lite for metrics, trace waterfall views
- **Frontend**: React + TypeScript with custom visualizations (charts, waterfall, log viewer)

### **Security & Infrastructure**
- **Backend**: NestJS (Express) + TypeScript, Prisma ORM, Redis (BullMQ)
- **Auth**: JWT access (5m) + rotating refresh (7d), MFA TOTP, CSRF protection, httpOnly cookies
- **Security**: RBAC, API keys, HMAC signing, rate limits, audit logs, PII scrubbing, IP allowlisting
- **Frontend**: React + Vite + TypeScript, React Router, TanStack Query
- **DevOps**: Docker Compose (6 services), GitHub Actions, ESLint, Prettier

## Repository Structure
```
apps/
  api/
    src/
      modules/
        ingest/          # Ingestion endpoints (logs, metrics, traces, RUM)
        query/           # Query API (search, aggregation)
        auth/            # Authentication & MFA
        users/           # User management
        apikeys/         # API key CRUD
      workers/
        normalizer/      # Background processing (PII scrubbing, enrichment)
      services/
        clickhouse.service.ts   # ClickHouse client
        timescale.service.ts    # TimescaleDB client
        redis-streams.service.ts # Message queue
  web/
    src/
      pages/
        Logs.tsx         # Log search & viewer
        Metrics.tsx      # PromQL query editor
        Traces.tsx       # Trace waterfall
        RUM.tsx          # Real User Monitoring
        Monitors.tsx     # Alert management
        SLOs.tsx         # SLO tracking
        Usage.tsx        # Usage & billing
      components/
        TimeSeriesChart.tsx  # Custom chart component
        LogViewer.tsx        # Log display component
prisma/
  schema.prisma          # PostgreSQL schema
clickhouse/init/         # ClickHouse table definitions
timescaledb/init/        # TimescaleDB hypertable setup
```

## Quick Start

### **Option 1: Full Platform (Recommended)**
```bash
# Start all services (Postgres, Redis, ClickHouse, TimescaleDB)
docker compose up -d

# Start backend API + normalizer worker
cd apps/api
npm install --legacy-peer-deps
npx prisma generate
npx prisma migrate dev
npm run start:dev

# Start frontend (in separate terminal)
cd apps/web
npm install --legacy-peer-deps
npm run dev
```

### **Option 2: One-Command Start**
```bash
./RUN.sh  # Starts everything (Docker services + API + Web)
```

### **Access Points**
- 🌐 **Web UI**: http://localhost:5173
- 🔧 **API**: http://localhost:3000
- 📚 **API Docs**: http://localhost:3000/docs
- 👤 **Admin Login**: `admin@aegis.local` / `ChangeMeNow!123`

## Platform Features

### **🔍 Observability Platform**
1. **Logs Explorer** (`/logs`)
   - Full-text search with filters (service, level, time range)
   - JSON attribute viewer with expand/collapse
   - Trace correlation (clickable trace IDs)
   - Auto-refresh with configurable intervals
   - Supports 1000+ logs per query

2. **Metrics Explorer** (`/metrics`)
   - PromQL-lite query language
   - Aggregations: `avg()`, `sum()`, `min()`, `max()`, `count()`
   - Label filtering: `metric{service="api"}`
   - Time-series charts with SVG rendering
   - Metric catalog browser

3. **Traces Viewer** (`/traces`)
   - Distributed trace search
   - Waterfall visualization with parent-child relationships
   - Duration analysis and error tracking
   - Service dependency mapping

4. **RUM Dashboard** (`/rum`)
   - Real User Monitoring for frontend
   - Web Vitals tracking (load time, errors)
   - Page performance metrics
   - Error tracking with stack traces

5. **Monitors & Alerts** (`/monitors`)
   - Alert rule creation (threshold, rate, error-ratio)
   - Multiple channels (Email, Slack, Webhook)
   - Query-based conditions

6. **SLO Dashboard** (`/slo`)
   - Service Level Objective tracking
   - Error budget calculations
   - Reliability scoring

7. **Usage & Billing** (`/usage`)
   - Data volume tracking (logs, metrics, spans, RUM)
   - Cost estimation by telemetry type
   - Daily/monthly aggregations

### **🔒 Security Features**
- **Authentication**: Argon2id password hashing, MFA TOTP, JWT access + refresh tokens
- **Authorization**: RBAC with role+permission model, API key authentication
- **Data Security**: PII scrubbing (emails, SSNs, credit cards), deterministic hashing
- **API Security**: HMAC signature verification, rate limiting, CSRF protection
- **Audit Trail**: Immutable audit logs for all sensitive operations
- **Network Security**: IP allowlisting, helmet with CSP, strict CORS
- **Multi-tenancy**: Organization-level isolation at DB and query level

## Data Ingestion

### **Example: Ingest Logs**
```bash
BODY='{"logs":[{"timestamp":"2025-10-31T10:00:00Z","service":"api","level":"error","message":"Database connection failed"}]}'
ORG_SECRET="your-org-secret"
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$ORG_SECRET" | awk '{print $2}')

curl -X POST http://localhost:3000/v1/logs \
  -H "Content-Type: application/json" \
  -H "x-org-key: obs_your_org_prefix" \
  -H "x-signature: sha256=$SIGNATURE" \
  -d "$BODY"
```

### **Supported Endpoints**
- `POST /v1/logs` - Log ingestion (max 1000/request)
- `POST /v1/metrics` - Metric ingestion (max 5000/request)
- `POST /v1/traces` - Trace span ingestion (max 500/request)
- `POST /v1/rum` - RUM event ingestion (max 1000/request)

All ingestion endpoints require:
- `x-org-key` header with organization API key prefix
- `x-signature` header with HMAC-SHA256 signature
- Optional `x-idempotency-key` for duplicate prevention

## Architecture

### **Data Flow**
```
Client/Agent
    ↓ POST /v1/{logs,metrics,traces,rum} + HMAC signature
Ingest Gateway (Rate limit + Validate)
    ↓ Add to Redis Streams
Normalizer Worker (PII scrub + Enrich + Validate)
    ↓ Write to storage
ClickHouse (logs, traces, RUM) / TimescaleDB (metrics)
    ↓ Query via API
React Frontend (Search + Visualize)
```

### **Database Schema**
- **ClickHouse**: `logs`, `spans`, `rum_events` tables with MergeTree engine
- **TimescaleDB**: `metrics` hypertable with continuous aggregates (1m, 5m, 1h)
- **PostgreSQL**: Users, organizations, API keys, monitors, SLOs, usage tracking

## Testing & Validation

### **Security Tests**
- ✅ Auth flow: Register → Login → MFA → Access protected routes
- ✅ RBAC: USER role cannot access admin endpoints
- ✅ API keys: HMAC signature verification on ingestion
- ✅ Rate limiting: 429 after exceeding limits
- ✅ CSRF: Missing token returns 403
- ✅ PII scrubbing: Emails/SSNs redacted in stored logs

### **Observability Tests**
- ✅ Log ingestion → Normalizer → ClickHouse → Query API
- ✅ Metric ingestion → TimescaleDB → Aggregation queries
- ✅ Trace ingestion → Span linkage → Waterfall view
- ✅ Usage tracking: Daily aggregates per organization

## Performance

### **Scale Targets**
- **Ingestion**: 10,000+ events/second per endpoint
- **Storage**: Billions of log entries (columnar compression)
- **Query**: Sub-second response for recent data (1-7 days)
- **Retention**: Configurable TTL (30-90 days default)

### **Optimizations**
- ClickHouse partitioning by day with ZSTD compression
- TimescaleDB continuous aggregates for metrics
- Redis Streams for async processing
- Batch insertions (10-50 items per batch)
- Query result caching

## Documentation

- **README** (`/readme`): This document
- **API Docs** (`/docs`): Interactive Swagger UI
- **Codebase Explanation** (`/codebase`): Architecture deep-dive
- **Observability Guide**: `OBSERVABILITY_FRONTEND_COMPLETE.md`

## License

MIT
