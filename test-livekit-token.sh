#!/bin/bash

# LiveKit Token Testing and Validation Script
# Tests token generation and decodes JWT to check claims

echo "🔍 LiveKit Token Validation Test"
echo "================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠ jq not installed, JSON output will not be pretty${NC}"
    JQ_AVAILABLE=false
else
    JQ_AVAILABLE=true
fi

echo -e "${BLUE}1. Checking system time...${NC}"
CURRENT_TIME=$(date +%s)
CURRENT_TIME_UTC=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
echo "  Current time: $CURRENT_TIME_UTC"
echo "  Unix timestamp: $CURRENT_TIME"
echo ""

echo -e "${BLUE}2. Checking .env configuration...${NC}"
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

LIVEKIT_URL=$(grep "^VITE_LIVEKIT_URL=" .env | cut -d '=' -f2)
LIVEKIT_KEY=$(grep "^LIVEKIT_API_KEY=" .env | cut -d '=' -f2)
LIVEKIT_SECRET=$(grep "^LIVEKIT_API_SECRET=" .env | cut -d '=' -f2)

echo "  VITE_LIVEKIT_URL: $LIVEKIT_URL"
echo "  LIVEKIT_API_KEY: ${LIVEKIT_KEY:0:20}..."
echo "  LIVEKIT_API_SECRET: ${LIVEKIT_SECRET:0:20}..."
echo ""

# Check for placeholders
if [[ "$LIVEKIT_URL" == *"placeholder"* ]] || [[ "$LIVEKIT_KEY" == *"placeholder"* ]]; then
    echo -e "${RED}❌ ERROR: Using placeholder credentials!${NC}"
    echo ""
    echo "You MUST use real LiveKit credentials."
    echo ""
    echo "Get them from:"
    echo "  1. Go to https://cloud.livekit.io"
    echo "  2. Sign in (or create free account)"
    echo "  3. Go to Settings → Keys"
    echo "  4. Copy WebSocket URL, API Key, and API Secret"
    echo "  5. Update .env file"
    echo ""
    exit 1
fi

echo -e "${BLUE}3. Testing backend connectivity...${NC}"
if ! curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend is not running!${NC}"
    echo ""
    echo "Start backend first:"
    echo "  npm run server"
    echo ""
    exit 1
fi
echo -e "${GREEN}✓${NC} Backend is running"
echo ""

echo -e "${BLUE}4. Requesting token from backend...${NC}"
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/livekit-token \
  -H "Content-Type: application/json" \
  -d '{
    "roomName": "test-room-'$RANDOM'",
    "participantName": "Test User",
    "interviewId": "test-'$CURRENT_TIME'"
  }')

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to request token${NC}"
    exit 1
fi

echo "Response received"
echo ""

# Parse token from response
if [ "$JQ_AVAILABLE" = true ]; then
    TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.token' 2>/dev/null)
    WS_URL=$(echo "$TOKEN_RESPONSE" | jq -r '.wsUrl' 2>/dev/null)
    ERROR=$(echo "$TOKEN_RESPONSE" | jq -r '.error' 2>/dev/null)
else
    TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d '"' -f4)
    WS_URL=$(echo "$TOKEN_RESPONSE" | grep -o '"wsUrl":"[^"]*"' | cut -d '"' -f4)
    ERROR=$(echo "$TOKEN_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d '"' -f4)
fi

if [ "$ERROR" != "null" ] && [ ! -z "$ERROR" ]; then
    echo -e "${RED}❌ Backend returned error:${NC}"
    echo "  $ERROR"
    echo ""
    echo "Full response:"
    if [ "$JQ_AVAILABLE" = true ]; then
        echo "$TOKEN_RESPONSE" | jq '.'
    else
        echo "$TOKEN_RESPONSE"
    fi
    exit 1
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${RED}❌ No token in response${NC}"
    echo ""
    echo "Full response:"
    if [ "$JQ_AVAILABLE" = true ]; then
        echo "$TOKEN_RESPONSE" | jq '.'
    else
        echo "$TOKEN_RESPONSE"
    fi
    exit 1
fi

echo -e "${GREEN}✓${NC} Token received"
echo "  Token length: ${#TOKEN} characters"
echo "  Token preview: ${TOKEN:0:50}..."
echo "  WebSocket URL: $WS_URL"
echo ""

echo -e "${BLUE}5. Decoding JWT token...${NC}"

# JWT has 3 parts: header.payload.signature
IFS='.' read -ra JWT_PARTS <<< "$TOKEN"

if [ ${#JWT_PARTS[@]} -ne 3 ]; then
    echo -e "${RED}❌ Invalid JWT format (expected 3 parts, got ${#JWT_PARTS[@]})${NC}"
    exit 1
fi

HEADER="${JWT_PARTS[0]}"
PAYLOAD="${JWT_PARTS[1]}"
SIGNATURE="${JWT_PARTS[2]}"

echo "  Header length: ${#HEADER}"
echo "  Payload length: ${#PAYLOAD}"
echo "  Signature length: ${#SIGNATURE}"
echo ""

# Decode header (base64url)
decode_base64url() {
    local input=$1
    # Replace URL-safe characters
    input=$(echo "$input" | tr '_-' '/+')
    # Add padding if needed
    case $((${#input} % 4)) in
        2) input="${input}==" ;;
        3) input="${input}=" ;;
    esac
    echo "$input" | base64 -d 2>/dev/null
}

DECODED_HEADER=$(decode_base64url "$HEADER")
DECODED_PAYLOAD=$(decode_base64url "$PAYLOAD")

echo -e "${BLUE}6. JWT Header:${NC}"
if [ "$JQ_AVAILABLE" = true ]; then
    echo "$DECODED_HEADER" | jq '.' 2>/dev/null || echo "$DECODED_HEADER"
else
    echo "$DECODED_HEADER"
fi
echo ""

echo -e "${BLUE}7. JWT Payload (Claims):${NC}"
if [ "$JQ_AVAILABLE" = true ]; then
    echo "$DECODED_PAYLOAD" | jq '.' 2>/dev/null || echo "$DECODED_PAYLOAD"
else
    echo "$DECODED_PAYLOAD"
fi
echo ""

# Extract important claims
if [ "$JQ_AVAILABLE" = true ]; then
    ISS=$(echo "$DECODED_PAYLOAD" | jq -r '.iss' 2>/dev/null)
    SUB=$(echo "$DECODED_PAYLOAD" | jq -r '.sub' 2>/dev/null)
    EXP=$(echo "$DECODED_PAYLOAD" | jq -r '.exp' 2>/dev/null)
    NBF=$(echo "$DECODED_PAYLOAD" | jq -r '.nbf' 2>/dev/null)
    VIDEO_GRANT=$(echo "$DECODED_PAYLOAD" | jq -r '.video' 2>/dev/null)
else
    ISS=$(echo "$DECODED_PAYLOAD" | grep -o '"iss":"[^"]*"' | cut -d '"' -f4)
    SUB=$(echo "$DECODED_PAYLOAD" | grep -o '"sub":"[^"]*"' | cut -d '"' -f4)
    EXP=$(echo "$DECODED_PAYLOAD" | grep -o '"exp":[0-9]*' | cut -d ':' -f2)
    NBF=$(echo "$DECODED_PAYLOAD" | grep -o '"nbf":[0-9]*' | cut -d ':' -f2)
fi

echo -e "${BLUE}8. Token Analysis:${NC}"
echo ""

# Check issuer (should match API key)
echo "  Issuer (iss): $ISS"
if [ ! -z "$ISS" ] && [ "$ISS" != "null" ]; then
    if [[ "$LIVEKIT_KEY" == "$ISS"* ]]; then
        echo -e "  ${GREEN}✓${NC} Issuer matches API key"
    else
        echo -e "  ${RED}✗${NC} Issuer does NOT match API key!"
        echo "    Expected to start with: ${LIVEKIT_KEY:0:20}..."
        echo "    Got: $ISS"
    fi
else
    echo -e "  ${YELLOW}⚠${NC}  No issuer in token"
fi
echo ""

# Check subject (participant identity)
echo "  Subject (sub): $SUB"
if [ ! -z "$SUB" ] && [ "$SUB" != "null" ]; then
    echo -e "  ${GREEN}✓${NC} Subject/identity present"
else
    echo -e "  ${RED}✗${NC} No subject/identity in token!"
fi
echo ""

# Check expiration
echo "  Expiration (exp): $EXP"
if [ ! -z "$EXP" ] && [ "$EXP" != "null" ] && [ "$EXP" -gt 0 ]; then
    EXP_DATE=$(date -d @$EXP "+%Y-%m-%d %H:%M:%S UTC" 2>/dev/null || date -r $EXP "+%Y-%m-%d %H:%M:%S UTC" 2>/dev/null)
    echo "  Expires at: $EXP_DATE"
    
    TIME_DIFF=$((EXP - CURRENT_TIME))
    if [ $TIME_DIFF -gt 0 ]; then
        echo -e "  ${GREEN}✓${NC} Token is valid for $TIME_DIFF seconds (~$((TIME_DIFF / 60)) minutes)"
    else
        echo -e "  ${RED}✗${NC} TOKEN HAS EXPIRED! (expired $((TIME_DIFF * -1)) seconds ago)"
        echo ""
        echo "  PROBLEM: Token expired before being used!"
        echo "  Possible causes:"
        echo "    - System clock is wrong"
        echo "    - Token TTL too short"
        echo "    - Time sync issue between client and server"
    fi
else
    echo -e "  ${YELLOW}⚠${NC}  No expiration in token"
fi
echo ""

# Check not-before
if [ ! -z "$NBF" ] && [ "$NBF" != "null" ] && [ "$NBF" -gt 0 ]; then
    echo "  Not before (nbf): $NBF"
    NBF_DATE=$(date -d @$NBF "+%Y-%m-%d %H:%M:%S UTC" 2>/dev/null || date -r $NBF "+%Y-%m-%d %H:%M:%S UTC" 2>/dev/null)
    echo "  Valid from: $NBF_DATE"
    
    if [ $NBF -gt $CURRENT_TIME ]; then
        echo -e "  ${RED}✗${NC} TOKEN NOT YET VALID! (valid in $((NBF - CURRENT_TIME)) seconds)"
        echo ""
        echo "  PROBLEM: Token not yet valid!"
        echo "  Possible cause: System clock is ahead"
    else
        echo -e "  ${GREEN}✓${NC} Token is already valid"
    fi
    echo ""
fi

# Check video grant
echo "  Video grant: $VIDEO_GRANT"
if [ ! -z "$VIDEO_GRANT" ] && [ "$VIDEO_GRANT" != "null" ]; then
    echo -e "  ${GREEN}✓${NC} Video permissions present"
else
    echo -e "  ${YELLOW}⚠${NC}  No video grant in token"
fi
echo ""

echo -e "${BLUE}9. Testing LiveKit server connectivity...${NC}"

# Extract hostname from WebSocket URL
if [[ "$WS_URL" =~ wss://([^/:]+) ]]; then
    LIVEKIT_HOST="${BASH_REMATCH[1]}"
    echo "  LiveKit host: $LIVEKIT_HOST"
    
    # Try to reach the regions endpoint
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        "https://${LIVEKIT_HOST}/settings/regions" \
        -H "Authorization: Bearer $TOKEN" \
        -m 5 2>/dev/null)
    
    echo "  HTTP Status: $HTTP_STATUS"
    
    case $HTTP_STATUS in
        200)
            echo -e "  ${GREEN}✓${NC} Server accepted the token!"
            ;;
        401)
            echo -e "  ${RED}✗${NC} Server REJECTED the token (401 Unauthorized)"
            echo ""
            echo "  This means:"
            echo "    - Token format is correct"
            echo "    - But signature verification failed"
            echo "    - API Key/Secret mismatch with this LiveKit project"
            echo ""
            echo "  SOLUTION:"
            echo "    1. Go to https://cloud.livekit.io"
            echo "    2. Make sure you're in the correct project"
            echo "    3. Go to Settings → Keys"
            echo "    4. Verify your API Key matches: ${LIVEKIT_KEY:0:20}..."
            echo "    5. Copy the correct API Secret"
            echo "    6. Update LIVEKIT_API_SECRET in .env"
            echo "    7. Restart backend: ./restart-all.sh"
            ;;
        403)
            echo -e "  ${RED}✗${NC} Server FORBIDDEN (403)"
            echo "  Token valid but insufficient permissions"
            ;;
        404)
            echo -e "  ${YELLOW}⚠${NC}  Endpoint not found (404)"
            echo "  LiveKit server might be different version"
            ;;
        000)
            echo -e "  ${RED}✗${NC} Cannot reach server (timeout)"
            echo "  Check network connectivity"
            ;;
        *)
            echo -e "  ${YELLOW}⚠${NC}  Unexpected status: $HTTP_STATUS"
            ;;
    esac
else
    echo -e "  ${RED}✗${NC} Could not extract hostname from: $WS_URL"
fi
echo ""

echo -e "${BLUE}10. Summary${NC}"
echo "==========="
echo ""

# Determine overall status
ISSUES_FOUND=0

if [ $TIME_DIFF -le 0 ] 2>/dev/null; then
    echo -e "${RED}❌ CRITICAL: Token is expired${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if [ "$HTTP_STATUS" = "401" ]; then
    echo -e "${RED}❌ CRITICAL: LiveKit rejects token (401 Unauthorized)${NC}"
    echo "   → API Key/Secret mismatch"
    echo "   → Get correct credentials from LiveKit Dashboard"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if [[ "$LIVEKIT_KEY" == *"placeholder"* ]]; then
    echo -e "${RED}❌ CRITICAL: Using placeholder credentials${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "Token is valid and server accepts it."
    echo "If you still have issues in the app:"
    echo "  1. Clear browser cache"
    echo "  2. Restart frontend: pkill -f vite && npm run dev"
    echo "  3. Try from incognito/private window"
else
    echo ""
    echo "Found $ISSUES_FOUND issue(s) that need fixing."
    echo ""
    echo "📚 See: LIVEKIT_QUICK_FIX.md for detailed help"
fi

echo ""
echo "================================="
echo ""
