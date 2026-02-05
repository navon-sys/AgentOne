#!/bin/bash

# Complete Restart Script
# This script fully restarts both frontend and backend with proper configuration

echo "🔄 Restarting HR Interview Platform"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo ""
    echo "Please create .env file first:"
    echo "  ./setup-env.sh"
    echo "  OR"
    echo "  cp .env.example .env"
    echo ""
    exit 1
fi

echo -e "${BLUE}1. Stopping existing services...${NC}"

# Kill all node processes (backend)
pkill -f "node.*server" 2>/dev/null && echo "  ✓ Stopped backend" || echo "  • Backend was not running"

# Kill all vite processes (frontend)
pkill -f "vite" 2>/dev/null && echo "  ✓ Stopped frontend" || echo "  • Frontend was not running"

# Wait a moment for processes to fully stop
sleep 2

echo ""
echo -e "${BLUE}2. Checking .env configuration...${NC}"

# Check critical variables
if grep -q "VITE_API_URL=http://localhost:3001" .env; then
    echo -e "  ${GREEN}✓${NC} VITE_API_URL is correctly set to localhost"
else
    echo -e "  ${YELLOW}⚠${NC}  VITE_API_URL might be misconfigured"
    echo "     Current value:"
    grep "VITE_API_URL" .env | head -1
    echo ""
    echo "     It should be:"
    echo "     VITE_API_URL=http://localhost:3001"
    echo ""
    read -p "Do you want to fix it now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Backup .env
        cp .env .env.backup
        # Fix the URL
        sed -i 's|VITE_API_URL=.*|VITE_API_URL=http://localhost:3001|g' .env
        echo -e "  ${GREEN}✓${NC} Fixed VITE_API_URL"
    fi
fi

# Check if Supabase is configured
if grep -q "VITE_SUPABASE_URL=your_supabase_project_url" .env; then
    echo -e "  ${YELLOW}⚠${NC}  Supabase not configured (using placeholder values)"
else
    echo -e "  ${GREEN}✓${NC} Supabase URL is configured"
fi

echo ""
echo -e "${BLUE}3. Clearing Vite cache...${NC}"
rm -rf .vite node_modules/.vite 2>/dev/null
echo "  ✓ Cache cleared"

echo ""
echo -e "${BLUE}4. Starting backend server...${NC}"

# Start backend in background
nohup npm run server > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo "  • Waiting for backend to start..."
sleep 3

# Check if backend is running
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Backend is running on http://localhost:3001"
    echo ""
    echo "  Configuration status:"
    curl -s http://localhost:3001/api/health | grep -o '"[^"]*":\s*[^,}]*' | sed 's/^/    /'
else
    echo -e "  ${RED}❌${NC} Backend failed to start!"
    echo ""
    echo "  Check logs:"
    echo "  tail -20 backend.log"
    exit 1
fi

echo ""
echo -e "${BLUE}5. Starting frontend dev server...${NC}"
echo "  • Frontend will start on http://localhost:5173"
echo "  • Press Ctrl+C to stop"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Start frontend (this will block, showing logs)
npm run dev

# If user stops frontend, also stop backend
echo ""
echo "Stopping backend..."
kill $BACKEND_PID 2>/dev/null
