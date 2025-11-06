# AegisGuard Setup Guide

Follow these steps to run the application locally.

## Prerequisites
- Node.js 20+
- Docker Desktop (running)
- Terminal

## Step-by-Step Setup

### 1. Start Database Services
Open a terminal and run:
```bash
cd /Users/mauritz/projects/aegisguard
docker compose up -d postgres redis
```

Wait ~10 seconds for services to start, then verify:
```bash
docker ps
```
You should see postgres:16 and redis:7 running.

---

### 2. Install Dependencies

```bash
# Root dependencies
npm install --legacy-peer-deps

# API dependencies
cd apps/api
npm install --legacy-peer-deps
cd ../..

# Web dependencies
cd apps/web
npm install --legacy-peer-deps
cd ../..
```

---

### 3. Setup Database

```bash
cd apps/api

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database (creates admin user and roles)
npm run seed

cd ../..
```

---

### 4. Start Backend API

Open a NEW terminal tab/window:
```bash
cd /Users/mauritz/projects/aegisguard/apps/api
npm run start:dev
```

Wait until you see: `API listening on http://localhost:3000`

---

### 5. Start Frontend Web App

Open ANOTHER NEW terminal tab/window:
```bash
cd /Users/mauritz/projects/aegisguard/apps/web
npm run dev
```

Wait until you see: `Local: http://localhost:5173/`

---

## Access the Application

- **Web UI**: http://localhost:5173
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/docs

### Default Admin Credentials
- Email: `admin@aegis.local`
- Password: `ChangeMeNow!123`

---

## Troubleshooting

### Port Already in Use
If port 3000 or 5173 is in use:
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Connection Refused
1. Check API is running: `curl http://localhost:3000/health`
2. Check database: `docker ps` should show postgres and redis
3. Check API logs in the terminal where you ran `npm run start:dev`

### Prisma Errors
```bash
cd apps/api
rm -rf node_modules
npm install --legacy-peer-deps
npx prisma generate
```

### Database Reset
```bash
cd apps/api
npx prisma migrate reset --force
npm run seed
```

---

## Stop Everything

```bash
# Stop Docker containers
docker compose down

# Kill node processes
pkill -f "ts-node"
pkill -f "vite"
```






