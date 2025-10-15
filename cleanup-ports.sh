#!/bin/bash

# Cleanup script for AI Interview Platform
# Kills any processes using ports 3001 and 5173

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║              🧹 Cleaning Up Server Processes                   ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "🔍 Checking for processes on port 3001..."
PORT_3001=$(sudo lsof -ti:3001)
if [ -n "$PORT_3001" ]; then
    echo "   Found process(es): $PORT_3001"
    sudo kill -9 $PORT_3001
    echo "   ✅ Killed process on port 3001"
else
    echo "   ✓ Port 3001 is free"
fi

echo ""
echo "🔍 Checking for processes on port 5173..."
PORT_5173=$(sudo lsof -ti:5173)
if [ -n "$PORT_5173" ]; then
    echo "   Found process(es): $PORT_5173"
    sudo kill -9 $PORT_5173
    echo "   ✅ Killed process on port 5173"
else
    echo "   ✓ Port 5173 is free"
fi

echo ""
echo "🔍 Checking for any node processes..."
NODE_PROCS=$(pgrep -f "node.*server/index.js|vite" | wc -l)
if [ "$NODE_PROCS" -gt 0 ]; then
    echo "   Found $NODE_PROCS node process(es)"
    pkill -9 -f "node.*server/index.js"
    pkill -9 -f "vite"
    echo "   ✅ Killed all related node processes"
else
    echo "   ✓ No stray node processes found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Cleanup complete! Ports are now free."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "You can now start the servers:"
echo "  $ ./start-backend.sh"
echo "  $ ./start-frontend.sh"
echo ""
