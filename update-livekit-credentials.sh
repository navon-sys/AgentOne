#!/bin/bash

# Interactive LiveKit Credentials Update Script
# This script helps you update .env with your new LiveKit credentials

echo "🔧 LiveKit Credentials Update Helper"
echo "====================================="
echo ""
echo "You created a new LiveKit project. Let's update your .env file."
echo ""
echo "⚠️  BEFORE YOU START:"
echo "   1. Open https://cloud.livekit.io in another window"
echo "   2. Go to your project → Settings → Keys"
echo "   3. Have the THREE values ready to copy"
echo ""
read -p "Press Enter when you're ready with your LiveKit Dashboard open..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating from template..."
    cp .env.example .env
fi

echo "================================================"
echo "STEP 1: WebSocket URL"
echo "================================================"
echo ""
echo "In LiveKit Dashboard, copy the 'WebSocket URL'"
echo "It looks like: wss://your-project-xxxxxx.livekit.cloud"
echo ""
read -p "Paste your WebSocket URL here: " WEBSOCKET_URL

if [ -z "$WEBSOCKET_URL" ]; then
    echo "❌ No URL provided. Exiting."
    exit 1
fi

if [[ ! "$WEBSOCKET_URL" =~ ^wss:// ]]; then
    echo "⚠️  Warning: URL doesn't start with wss://"
    echo "   Make sure you copied the correct value."
fi

echo ""
echo "================================================"
echo "STEP 2: API Key"
echo "================================================"
echo ""
echo "In LiveKit Dashboard, copy the 'API Key'"
echo "It looks like: APIxxxxxxxxxxxxxxxx"
echo ""
read -p "Paste your API Key here: " API_KEY

if [ -z "$API_KEY" ]; then
    echo "❌ No API Key provided. Exiting."
    exit 1
fi

if [[ ! "$API_KEY" =~ ^API ]]; then
    echo "⚠️  Warning: API Key doesn't start with 'API'"
    echo "   Make sure you copied the correct value."
fi

echo ""
echo "================================================"
echo "STEP 3: API Secret"
echo "================================================"
echo ""
echo "In LiveKit Dashboard, copy the 'API Secret'"
echo "It's a long random string (30-50 characters)"
echo ""
read -sp "Paste your API Secret here (hidden): " API_SECRET
echo ""

if [ -z "$API_SECRET" ]; then
    echo "❌ No API Secret provided. Exiting."
    exit 1
fi

if [ ${#API_SECRET} -lt 20 ]; then
    echo "⚠️  Warning: API Secret seems short (${#API_SECRET} chars)"
    echo "   Make sure you copied the complete value."
fi

echo ""
echo "================================================"
echo "STEP 4: Updating .env file..."
echo "================================================"
echo ""

# Backup existing .env
cp .env .env.backup.$(date +%s)
echo "✓ Created backup: .env.backup.*"

# Update the values
sed -i "s|^VITE_LIVEKIT_URL=.*|VITE_LIVEKIT_URL=$WEBSOCKET_URL|g" .env
sed -i "s|^LIVEKIT_API_KEY=.*|LIVEKIT_API_KEY=$API_KEY|g" .env
sed -i "s|^LIVEKIT_API_SECRET=.*|LIVEKIT_API_SECRET=$API_SECRET|g" .env

echo "✓ Updated .env file"
echo ""

# Verify
echo "================================================"
echo "STEP 5: Verification"
echo "================================================"
echo ""
echo "Current .env configuration:"
echo "  VITE_LIVEKIT_URL: $WEBSOCKET_URL"
echo "  LIVEKIT_API_KEY: ${API_KEY:0:20}..."
echo "  LIVEKIT_API_SECRET: ${API_SECRET:0:20}... (${#API_SECRET} chars)"
echo ""

# Check for placeholders
if grep -q "placeholder" .env; then
    echo "⚠️  Warning: 'placeholder' still found in .env"
    echo "   Some values might not have been updated."
fi

echo "================================================"
echo "STEP 6: Restart Backend"
echo "================================================"
echo ""
echo "The backend needs to restart to use new credentials."
echo ""
read -p "Restart backend now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Stopping old backend..."
    pkill -f "node.*server" 2>/dev/null || true
    sleep 2
    
    echo "Starting new backend..."
    npm run server > backend.log 2>&1 &
    
    echo "Waiting for backend to start..."
    sleep 3
    
    # Test health
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✓ Backend started successfully"
        
        # Check LiveKit status
        HEALTH=$(curl -s http://localhost:3001/api/health)
        if echo "$HEALTH" | grep -q '"livekit":true'; then
            echo "✓ LiveKit configured in backend"
        else
            echo "⚠️  LiveKit might not be configured"
        fi
    else
        echo "⚠️  Backend might not have started properly"
        echo "   Check logs: tail backend.log"
    fi
else
    echo "Skipped restart. Remember to restart manually:"
    echo "  pkill -f 'node.*server' && npm run server"
fi

echo ""
echo "================================================"
echo "STEP 7: Test Token Generation"
echo "================================================"
echo ""

if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "Testing token generation..."
    TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/livekit-token \
      -H "Content-Type: application/json" \
      -d '{"roomName":"test","participantName":"Test","interviewId":"123"}')
    
    if echo "$TOKEN_RESPONSE" | grep -q '"token":"eyJ'; then
        echo "✓ Token generation successful!"
        TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d '"' -f4)
        echo "  Token preview: ${TOKEN:0:50}..."
    else
        echo "⚠️  Token generation might have issues"
        echo "  Response: $TOKEN_RESPONSE"
    fi
else
    echo "⚠️  Backend not running, skipping token test"
fi

echo ""
echo "================================================"
echo "✅ DONE!"
echo "================================================"
echo ""
echo "What to do next:"
echo ""
echo "1. Run comprehensive test:"
echo "   ./test-livekit-token.sh"
echo ""
echo "2. Restart frontend:"
echo "   pkill -f vite && npm run dev"
echo ""
echo "3. Test in browser:"
echo "   - Clear browser cache (or use Incognito)"
echo "   - Go to http://localhost:5173"
echo "   - Start an interview"
echo "   - Should work now!"
echo ""
echo "If still having issues:"
echo "   - Check backend logs: tail backend.log"
echo "   - Verify credentials in LiveKit Dashboard"
echo "   - Make sure all three values are from SAME project"
echo ""
