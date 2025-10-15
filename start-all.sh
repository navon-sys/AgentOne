#!/bin/bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd /home/azureuser/webapp

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║           🚀 AI Interview Platform - Server Startup            ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "🧹 Cleaning up ports..."
./cleanup-ports.sh

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Starting Backend Server..."
nohup node server/index.js > backend.log 2>&1 &
BACKEND_PID=$!
echo "   Process ID: $BACKEND_PID"

sleep 3

# Check if backend started successfully
if sudo lsof -ti:3001 > /dev/null 2>&1; then
    echo "   ✅ Backend started successfully on port 3001"
    
    # Test health endpoint
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "   ✅ Health check passed"
    else
        echo "   ⚠️  Health check failed - backend may still be starting"
    fi
else
    echo "   ❌ Backend failed to start - check backend.log for errors"
fi

echo ""
echo "🚀 Starting Frontend Server..."
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Process ID: $FRONTEND_PID"

sleep 5

# Check if frontend started successfully
if sudo lsof -ti:5173 > /dev/null 2>&1; then
    echo "   ✅ Frontend started successfully on port 5173"
else
    echo "   ❌ Frontend failed to start - check frontend.log for errors"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Startup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    📍 ACCESS INFORMATION                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 Internal Access (from VM):"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "🌍 External Access (from anywhere):"
echo "   Frontend: http://20.82.140.166:5173"
echo "   Backend:  http://20.82.140.166:3001"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Monitoring:"
echo "   Backend logs:  tail -f backend.log"
echo "   Frontend logs: tail -f frontend.log"
echo "   Both logs:     tail -f backend.log frontend.log"
echo ""
echo "🛑 Stop servers:"
echo "   ./cleanup-ports.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT: If external access doesn't work:"
echo ""
echo "   1. Check Azure NSG Rules"
echo "      → Azure Portal → VM → Networking → Network Security Group"
echo "      → Add inbound rules for ports 5173 and 3001"
echo ""
echo "   2. See detailed troubleshooting:"
echo "      → cat FIX_BACKEND_CONNECTION.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
