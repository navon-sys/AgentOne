#!/bin/bash

# Complete App Setup Script
# Fixes BOTH Supabase and LiveKit credentials

echo "🔧 Complete HR Interview App Setup"
echo "===================================="
echo ""
echo "This script will help you configure:"
echo "  1. Supabase (Database)"
echo "  2. LiveKit (Audio/Video)"
echo ""
echo "Time required: ~10 minutes"
echo ""

read -p "Press Enter to start..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check .env exists
if [ ! -f .env ]; then
    echo "Creating .env from template..."
    cp .env.example .env
fi

echo "========================================"
echo "PART 1: SUPABASE SETUP"
echo "========================================"
echo ""
echo "Supabase provides the database for your app."
echo ""
echo "Do you have a Supabase project?"
read -p "(y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please create one first:"
    echo "  1. Go to https://supabase.com"
    echo "  2. Sign up (FREE)"
    echo "  3. Create new project"
    echo "  4. Wait for project to initialize (~2 minutes)"
    echo ""
    echo "Then run this script again."
    exit 0
fi

echo ""
echo "Great! Open your Supabase Dashboard in another window:"
echo "  → https://supabase.com/dashboard"
echo "  → Click your project"
echo "  → Go to Settings → API"
echo ""
read -p "Press Enter when you're ready..."
echo ""

echo "--------------------"
echo "Supabase Value 1/3"
echo "--------------------"
echo ""
echo "Copy the 'Project URL'"
echo "It looks like: https://abcdefgh.supabase.co"
echo ""
read -p "Paste Project URL: " SUPABASE_URL

if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}❌ No URL provided${NC}"
    exit 1
fi

echo ""
echo "--------------------"
echo "Supabase Value 2/3"
echo "--------------------"
echo ""
echo "Copy the 'anon public' key"
echo "It's a long string starting with eyJ..."
echo ""
read -p "Paste anon key: " SUPABASE_ANON

if [ -z "$SUPABASE_ANON" ]; then
    echo -e "${RED}❌ No anon key provided${NC}"
    exit 1
fi

echo ""
echo "--------------------"
echo "Supabase Value 3/3"
echo "--------------------"
echo ""
echo "Copy the 'service_role secret' key"
echo "⚠️  This is secret! Keep it safe."
echo ""
read -sp "Paste service_role key (hidden): " SUPABASE_SERVICE
echo ""

if [ -z "$SUPABASE_SERVICE" ]; then
    echo -e "${RED}❌ No service_role key provided${NC}"
    exit 1
fi

# Update Supabase values
sed -i "s|^VITE_SUPABASE_URL=.*|VITE_SUPABASE_URL=$SUPABASE_URL|g" .env
sed -i "s|^VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON|g" .env
sed -i "s|^SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE|g" .env

echo -e "${GREEN}✓${NC} Supabase credentials saved to .env"
echo ""

echo "--------------------"
echo "Database Setup"
echo "--------------------"
echo ""
echo "Now you need to create the database tables."
echo ""
echo "Steps:"
echo "  1. In Supabase Dashboard → SQL Editor"
echo "  2. Click 'New query'"
echo "  3. Copy the entire content from this file:"
echo "     /home/user/webapp/supabase-schema.sql"
echo "  4. Paste into SQL Editor"
echo "  5. Click 'Run'"
echo ""
echo "Let me show you the schema:"
echo ""
read -p "Press Enter to view schema (you can copy from here)..."
echo ""
echo "========== COPY FROM HERE =========="
cat supabase-schema.sql
echo ""
echo "========== COPY UNTIL HERE =========="
echo ""
echo ""
read -p "After you've run the SQL in Supabase, press Enter to continue..."
echo ""

echo "========================================"
echo "PART 2: LIVEKIT SETUP"
echo "========================================"
echo ""
echo "LiveKit provides real-time audio for interviews."
echo ""
echo "Do you have a LiveKit project?"
read -p "(y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please create one first:"
    echo "  1. Go to https://livekit.io"
    echo "  2. Sign up (FREE)"
    echo "  3. Create new project"
    echo ""
    echo "Then run this script again."
    exit 0
fi

echo ""
echo "Open LiveKit Dashboard:"
echo "  → https://cloud.livekit.io"
echo "  → Click your project"
echo "  → Go to Settings → Keys"
echo ""
read -p "Press Enter when ready..."
echo ""

echo "--------------------"
echo "LiveKit Value 1/3"
echo "--------------------"
echo ""
echo "Copy 'WebSocket URL'"
echo "It looks like: wss://yourproject-abc123.livekit.cloud"
echo ""
read -p "Paste WebSocket URL: " LIVEKIT_URL

if [ -z "$LIVEKIT_URL" ]; then
    echo -e "${RED}❌ No URL provided${NC}"
    exit 1
fi

echo ""
echo "--------------------"
echo "LiveKit Value 2/3"
echo "--------------------"
echo ""
echo "Copy 'API Key'"
echo "It starts with: API..."
echo ""
read -p "Paste API Key: " LIVEKIT_KEY

if [ -z "$LIVEKIT_KEY" ]; then
    echo -e "${RED}❌ No API Key provided${NC}"
    exit 1
fi

echo ""
echo "--------------------"
echo "LiveKit Value 3/3"
echo "--------------------"
echo ""
echo "Copy 'API Secret'"
echo "Long random string"
echo ""
read -sp "Paste API Secret (hidden): " LIVEKIT_SECRET
echo ""

if [ -z "$LIVEKIT_SECRET" ]; then
    echo -e "${RED}❌ No API Secret provided${NC}"
    exit 1
fi

# Update LiveKit values
sed -i "s|^VITE_LIVEKIT_URL=.*|VITE_LIVEKIT_URL=$LIVEKIT_URL|g" .env
sed -i "s|^LIVEKIT_API_KEY=.*|LIVEKIT_API_KEY=$LIVEKIT_KEY|g" .env
sed -i "s|^LIVEKIT_API_SECRET=.*|LIVEKIT_API_SECRET=$LIVEKIT_SECRET|g" .env

echo -e "${GREEN}✓${NC} LiveKit credentials saved to .env"
echo ""

echo "========================================"
echo "VERIFICATION"
echo "========================================"
echo ""

echo "Checking .env file..."
if grep -q "placeholder" .env; then
    echo -e "${YELLOW}⚠${NC}  Warning: Some placeholder values still exist"
else
    echo -e "${GREEN}✓${NC} No placeholders found"
fi
echo ""

echo "Current configuration:"
echo "  Supabase URL: $SUPABASE_URL"
echo "  Supabase Anon: ${SUPABASE_ANON:0:30}..."
echo "  LiveKit URL: $LIVEKIT_URL"
echo "  LiveKit Key: ${LIVEKIT_KEY:0:20}..."
echo ""

echo "========================================"
echo "RESTART SERVICES"
echo "========================================"
echo ""

read -p "Restart backend now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Stopping old backend..."
    pkill -f "node.*server" 2>/dev/null || true
    sleep 2
    
    echo "Starting new backend..."
    npm run server > backend.log 2>&1 &
    sleep 3
    
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Backend started"
    else
        echo -e "${YELLOW}⚠${NC}  Backend might not have started"
        echo "Check: tail backend.log"
    fi
fi

echo ""
echo "========================================"
echo "✅ SETUP COMPLETE!"
echo "========================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Restart frontend:"
echo "   pkill -f vite && npm run dev"
echo ""
echo "2. Open browser (use Incognito/Private):"
echo "   http://localhost:5173"
echo ""
echo "3. Test the app:"
echo "   - Sign up / Sign in"
echo "   - Create a job"
echo "   - Add a candidate"
echo "   - Start interview"
echo ""
echo "If you have issues:"
echo "   - Check: tail backend.log"
echo "   - Verify database tables exist in Supabase"
echo "   - Run: ./test-livekit-token.sh"
echo ""
echo "🎉 Your app is ready to use!"
echo ""
