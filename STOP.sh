#!/bin/bash

echo "🛑 Stopping AegisGuard..."

# Kill Node processes
if [ -f .api.pid ]; then
    kill $(cat .api.pid) 2>/dev/null && echo "✅ API stopped"
    rm .api.pid
fi

if [ -f .web.pid ]; then
    kill $(cat .web.pid) 2>/dev/null && echo "✅ Web stopped"
    rm .web.pid
fi

# Fallback: kill by name
pkill -f "ts-node-dev" 2>/dev/null
pkill -f "vite" 2>/dev/null

# Stop Docker services
docker compose down && echo "✅ Docker services stopped"

echo "✅ All services stopped"





