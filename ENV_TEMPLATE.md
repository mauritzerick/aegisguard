# Environment Variables Configuration

## Backend (.env)

Create a `.env` file in the project root with the following variables:

```bash
# ======================
# DATABASE CONFIGURATION
# ======================

# PostgreSQL (Main database for users, roles, sessions, audit logs, organizations)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aegis"

# ClickHouse (Logs, traces, RUM events)
CLICKHOUSE_HOST="http://localhost:8123"
CLICKHOUSE_DATABASE="observability"
CLICKHOUSE_USER="aegis"
CLICKHOUSE_PASSWORD="aegis_ch_pass"

# TimescaleDB (Metrics)
TIMESCALE_HOST="localhost"
TIMESCALE_PORT=5433
TIMESCALE_DATABASE="metrics"
TIMESCALE_USER="aegis"
TIMESCALE_PASSWORD="aegis_ts_pass"

# Redis (Sessions, rate limiting, streams)
REDIS_HOST="localhost"
REDIS_PORT=6379

# ======================
# SECURITY
# ======================

# JWT Secret (CHANGE IN PRODUCTION!)
JWT_SECRET="your-super-secret-jwt-key-change-in-production-minimum-32-characters-recommended"

# JWT Expiry
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Session Rotation
SESSION_ROTATE_DAYS=30

# ======================
# WORKER CONFIGURATION
# ======================

# Enable/disable normalizer worker
NORMALIZER_ENABLED="true"

# ======================
# CORS CONFIGURATION
# ======================

# Allowed origins (comma-separated)
CORS_ORIGIN="http://localhost:5173,http://127.0.0.1:5173"

# ======================
# RATE LIMITING
# ======================

# Rate limits per minute
ORG_RATE_LIMIT=10000
IP_RATE_LIMIT=1000

# ======================
# NODE ENVIRONMENT
# ======================

NODE_ENV="development"
PORT=3000
```

## Frontend (apps/web/.env.web)

Create a `.env.web` file in `apps/web/` directory:

```bash
VITE_API_URL="http://localhost:3000"
```

## Docker Environment

For Docker deployments, use `.env.docker`:

```bash
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/aegis"
CLICKHOUSE_HOST="http://clickhouse:8123"
CLICKHOUSE_DATABASE="observability"
CLICKHOUSE_USER="aegis"
CLICKHOUSE_PASSWORD="aegis_ch_pass"
TIMESCALE_HOST="timescaledb"
TIMESCALE_PORT=5432
TIMESCALE_DATABASE="metrics"
TIMESCALE_USER="aegis"
TIMESCALE_PASSWORD="aegis_ts_pass"
REDIS_HOST="redis"
REDIS_PORT=6379
JWT_SECRET="your-docker-jwt-secret-change-in-production"
NORMALIZER_ENABLED="true"
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="production"
PORT=3000
```

## Production Recommendations

### Security
- ✅ Use **strong random JWT secrets** (minimum 32 characters)
- ✅ Use **environment-specific secrets** (don't reuse dev secrets)
- ✅ Store secrets in **secret managers** (AWS Secrets Manager, HashiCorp Vault)
- ✅ Enable **HTTPS** in production (use reverse proxy like Nginx)

### Database
- ✅ Use **connection pooling** (already configured in services)
- ✅ Enable **SSL/TLS** for database connections
- ✅ Use **read replicas** for ClickHouse/TimescaleDB at scale
- ✅ Configure **backup retention policies**

### Rate Limiting
- ✅ Adjust `ORG_RATE_LIMIT` and `IP_RATE_LIMIT` based on your needs
- ✅ Monitor Redis memory usage
- ✅ Consider **distributed rate limiting** for multi-instance deployments

### Worker Configuration
- ✅ Run **multiple normalizer workers** for high throughput
- ✅ Monitor Redis Streams lag
- ✅ Set up **dead letter queues** for failed messages

## Quick Start

1. Copy template:
   ```bash
   cp ENV_TEMPLATE.md .env
   # Edit .env with your values
   ```

2. Generate JWT secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. Start services:
   ```bash
   docker-compose up -d
   ./RUN.sh
   ```





