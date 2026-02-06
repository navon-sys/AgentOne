#!/bin/bash

# Comprehensive Diagnostic Script
# Tests EXACTLY what's happening with your LiveKit setup

echo "🔍 Complete LiveKit Diagnostic"
echo "==============================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}1. Checking .env file...${NC}"
echo ""

if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file NOT found!${NC}"
    exit 1
fi

echo "Current LiveKit configuration in .env:"
grep -E "LIVEKIT|VITE_LIVEKIT" .env
echo ""

# Check for placeholders
if grep -E "LIVEKIT|VITE_LIVEKIT" .env | grep -q "placeholder"; then
    echo -e "${RED}❌ CRITICAL: .env file has PLACEHOLDER values!${NC}"
    echo ""
    echo "You MUST update .env with real LiveKit credentials."
    echo ""
    echo "Current values in .env:"
    grep -E "LIVEKIT|VITE_LIVEKIT" .env | while read line; do
        key=$(echo "$line" | cut -d'=' -f1)
        value=$(echo "$line" | cut -d'=' -f2)
        echo "  $key = $value ← PLACEHOLDER!"
    done
    echo ""
    echo "To fix:"
    echo "  1. nano /home/user/webapp/.env"
    echo "  2. Replace placeholder values with real credentials from:"
    echo "     https://cloud.livekit.io → Your Project → Settings → Keys"
    echo "  3. Save and restart backend"
    echo ""
    exit 1
else
    echo -e "${GREEN}✓${NC} No placeholder values in .env"
fi

echo ""
echo -e "${BLUE}2. Checking backend is running...${NC}"
echo ""

if ! curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend is NOT running!${NC}"
    echo ""
    echo "Start backend:"
    echo "  cd /home/user/webapp"
    echo "  npm run server"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓${NC} Backend is running"
echo ""

# Get health status
HEALTH=$(curl -s http://localhost:3001/api/health)
echo "Backend health status:"
echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"
echo ""

if echo "$HEALTH" | grep -q '"livekit":false'; then
    echo -e "${RED}❌ Backend says LiveKit is NOT configured!${NC}"
    echo ""
    echo "This means backend couldn't find:"
    echo "  - LIVEKIT_API_KEY, or"
    echo "  - LIVEKIT_API_SECRET"
    echo ""
    echo "Check .env file and restart backend."
    echo ""
fi

echo ""
echo -e "${BLUE}3. Testing token generation...${NC}"
echo ""

TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/livekit-token \
  -H "Content-Type: application/json" \
  -d '{"roomName":"diagnostic-test","participantName":"Test User","interviewId":"diag-123"}')

echo "Backend response:"
echo "$TOKEN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$TOKEN_RESPONSE"
echo ""

# Parse response
TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
    TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)
fi

WSURL=$(echo "$TOKEN_RESPONSE" | grep -o '"wsUrl":"[^"]*"' | cut -d'"' -f4)
if [ -z "$WSURL" ]; then
    WSURL=$(echo "$TOKEN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('wsUrl', ''))" 2>/dev/null)
fi

echo ""
echo -e "${BLUE}4. Analyzing response...${NC}"
echo ""

# Check if token is empty object
if echo "$TOKEN_RESPONSE" | grep -q '"token":{}'; then
    echo -e "${RED}❌ PROBLEM: Token is EMPTY OBJECT {}${NC}"
    echo ""
    echo "This happens when:"
    echo "  1. LIVEKIT_API_KEY or LIVEKIT_API_SECRET are missing"
    echo "  2. Or they are placeholder/invalid values"
    echo "  3. LiveKit SDK failed to generate JWT"
    echo ""
    echo "Solution:"
    echo "  - Check LIVEKIT_API_KEY in .env (should start with 'API')"
    echo "  - Check LIVEKIT_API_SECRET in .env (long random string)"
    echo "  - Make sure they're from same LiveKit project"
    echo "  - Restart backend after fixing"
    echo ""
    exit 1
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" = "{}" ]; then
    echo -e "${RED}❌ PROBLEM: No valid token received${NC}"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓${NC} Token generated"
echo "  Token length: ${#TOKEN} characters"
echo "  Token preview: ${TOKEN:0:60}..."
echo ""

if [ ! -z "$WSURL" ]; then
    echo "  WebSocket URL: $WSURL"
    
    if echo "$WSURL" | grep -q "placeholder"; then
        echo -e "  ${RED}✗ WebSocket URL is placeholder!${NC}"
        echo ""
        echo "  This means VITE_LIVEKIT_URL in .env is not set properly."
        exit 1
    else
        echo -e "  ${GREEN}✓${NC} WebSocket URL looks valid"
    fi
fi

echo ""
echo -e "${BLUE}5. Decoding JWT token...${NC}"
echo ""

# Decode JWT payload
IFS='.' read -ra PARTS <<< "$TOKEN"
if [ ${#PARTS[@]} -eq 3 ]; then
    PAYLOAD="${PARTS[1]}"
    
    # Decode base64url
    PAYLOAD=$(echo "$PAYLOAD" | tr '_-' '/+')
    case $((${#PAYLOAD} % 4)) in
        2) PAYLOAD="${PAYLOAD}==" ;;
        3) PAYLOAD="${PAYLOAD}=" ;;
    esac
    
    DECODED=$(echo "$PAYLOAD" | base64 -d 2>/dev/null)
    
    echo "Token claims:"
    echo "$DECODED" | python3 -m json.tool 2>/dev/null || echo "$DECODED"
    echo ""
    
    # Extract expiration
    EXP=$(echo "$DECODED" | python3 -c "import sys, json; print(json.load(sys.stdin).get('exp', 0))" 2>/dev/null)
    if [ ! -z "$EXP" ] && [ "$EXP" -gt 0 ]; then
        CURRENT=$(date +%s)
        DIFF=$((EXP - CURRENT))
        
        if [ $DIFF -gt 0 ]; then
            echo -e "${GREEN}✓${NC} Token expires in $DIFF seconds (~$((DIFF / 60)) minutes)"
        else
            echo -e "${RED}✗ Token EXPIRED $((DIFF * -1)) seconds ago!${NC}"
        fi
    fi
    
    # Extract issuer
    ISS=$(echo "$DECODED" | python3 -c "import sys, json; print(json.load(sys.stdin).get('iss', ''))" 2>/dev/null)
    if [ ! -z "$ISS" ]; then
        echo "  Issuer (API Key): $ISS"
    fi
else
    echo -e "${RED}✗ Invalid JWT format${NC}"
fi

echo ""
echo -e "${BLUE}6. Testing LiveKit server connectivity...${NC}"
echo ""

if [ ! -z "$WSURL" ]; then
    # Extract hostname
    HOST=$(echo "$WSURL" | sed 's|wss://||' | sed 's|ws://||' | cut -d'/' -f1)
    
    echo "Testing connection to: $HOST"
    
    # Try preflight (OPTIONS)
    echo ""
    echo "Testing preflight (OPTIONS request):"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "https://${HOST}/settings/regions" -m 5 2>/dev/null)
    echo "  Status: $HTTP_CODE"
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
        echo -e "  ${GREEN}✓${NC} Preflight succeeds"
    else
        echo -e "  ${YELLOW}⚠${NC}  Preflight status: $HTTP_CODE"
    fi
    
    # Try with token (GET)
    echo ""
    echo "Testing GET request WITH token:"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        "https://${HOST}/settings/regions" \
        -H "Authorization: Bearer $TOKEN" \
        -m 5 2>/dev/null)
    echo "  Status: $HTTP_CODE"
    
    case $HTTP_CODE in
        200)
            echo -e "  ${GREEN}✓${NC} Server ACCEPTS the token!"
            echo ""
            echo -e "${GREEN}✅ EVERYTHING WORKS!${NC}"
            echo ""
            echo "Your LiveKit setup is correct."
            echo "If you still have issues in the app:"
            echo "  - Clear browser cache"
            echo "  - Use Incognito/Private window"
            echo "  - Check browser console for other errors"
            ;;
        401)
            echo -e "  ${RED}✗${NC} Server REJECTS the token (401 Unauthorized)"
            echo ""
            echo -e "${RED}❌ PROBLEM FOUND!${NC}"
            echo ""
            echo "The token is generated but LiveKit server rejects it."
            echo ""
            echo "This means:"
            echo "  1. Token signature is invalid"
            echo "  2. API Key/Secret don't match this LiveKit project"
            echo "  3. The credentials are from a different/deleted project"
            echo ""
            echo "Solution:"
            echo "  1. Go to https://cloud.livekit.io"
            echo "  2. Make sure you're in the correct project"
            echo "  3. Go to Settings → Keys"
            echo "  4. Copy ALL THREE values:"
            echo "     - WebSocket URL"
            echo "     - API Key"  
            echo "     - API Secret"
            echo "  5. ALL THREE must be from the SAME project!"
            echo "  6. Update .env with these values"
            echo "  7. Restart backend: pkill -f 'node.*server' && npm run server"
            echo ""
            echo "NOTE: If you deleted and recreated the LiveKit project,"
            echo "      you MUST update ALL THREE credentials in .env!"
            ;;
        403)
            echo -e "  ${RED}✗${NC} Forbidden (403)"
            echo "  Token valid but insufficient permissions"
            ;;
        404)
            echo -e "  ${YELLOW}⚠${NC}  Not found (404)"
            echo "  Server exists but endpoint might be different"
            ;;
        000)
            echo -e "  ${RED}✗${NC} Cannot reach server (timeout/network error)"
            echo "  Check internet connection"
            ;;
        *)
            echo -e "  ${YELLOW}⚠${NC}  Unexpected status: $HTTP_CODE"
            ;;
    esac
else
    echo "No WebSocket URL to test"
fi

echo ""
echo "================================="
echo ""

if grep -E "LIVEKIT|VITE_LIVEKIT" .env | grep -q "placeholder"; then
    echo -e "${RED}ACTION REQUIRED:${NC}"
    echo "  Update .env with real LiveKit credentials!"
    echo ""
    echo "  File: /home/user/webapp/.env"
    echo ""
    echo "  Get credentials from:"
    echo "  https://cloud.livekit.io → Your Project → Settings → Keys"
    echo ""
fi
