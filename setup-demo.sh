#!/bin/bash
set -e

echo "🎪 AegisGuard Demo Candy Pack - Setup Script"
echo "==========================================="
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd apps/api
npm install --legacy-peer-deps
cd ../..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd apps/web
npm install --legacy-peer-deps
cd ../..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Next steps:"
echo "   1. Start the platform: ./RUN.sh"
echo "   2. Open Demo Hub: http://localhost:5173/demo"
echo "   3. Generate demo data and explore features!"
echo ""
echo "📚 Demo Features:"
echo "   • Dark Mode / Theme Toggle"
echo "   • Live Tail (Real-time log streaming)"
echo "   • Webhook Playground (HMAC testing)"
echo "   • Synthetic Health Checks"
echo "   • Data Generators (logs, metrics, spikes)"
echo ""
echo "📖 Full documentation: DEMO_CANDY_PACK_COMPLETE.md"
echo ""

