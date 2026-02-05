#!/bin/bash

# LiveKit Credentials Diagnostic Script
# This script helps identify LiveKit configuration issues

echo "🔍 LiveKit Credentials Diagnostic"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check .env file
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    exit 1
fi

echo -e "${BLUE}1. Checking LiveKit configuration in .env...${NC}"
echo ""

# Extract LiveKit values
LIVEKIT_URL=$(grep "^VITE_LIVEKIT_URL=" .env | cut -d '=' -f2)
LIVEKIT_KEY=$(grep "^LIVEKIT_API_KEY=" .env | cut -d '=' -f2)
LIVEKIT_SECRET=$(grep "^LIVEKIT_API_SECRET=" .env | cut -d '=' -f2)

# Show current configuration (masked)
echo "Current configuration:"
echo "  VITE_LIVEKIT_URL: $LIVEKIT_URL"
echo "  LIVEKIT_API_KEY:  ${LIVEKIT_KEY:0:10}... (${#LIVEKIT_KEY} chars)"
echo "  LIVEKIT_API_SECRET: ${LIVEKIT_SECRET:0:10}... (${#LIVEKIT_SECRET} chars)"
echo ""

# Check for placeholders
if [[ "$LIVEKIT_URL" == *"placeholder"* ]]; then
    echo -e "${RED}❌ VITE_LIVEKIT_URL is using placeholder value!${NC}"
    echo "   You need real LiveKit credentials."
    echo ""
    echo "   Get them from: https://livekit.io"
    exit 1
fi

if [[ "$LIVEKIT_KEY" == *"placeholder"* ]]; then
    echo -e "${RED}❌ LIVEKIT_API_KEY is using placeholder value!${NC}"
    echo "   You need real LiveKit credentials."
    exit 1
fi

if [[ "$LIVEKIT_SECRET" == *"placeholder"* ]]; then
    echo -e "${RED}❌ LIVEKIT_API_SECRET is using placeholder value!${NC}"
    echo "   You need real LiveKit credentials."
    exit 1
fi

echo -e "${GREEN}✓${NC} No placeholder values detected"
echo ""

# Check URL format
echo -e "${BLUE}2. Validating URL format...${NC}"
if [[ "$LIVEKIT_URL" =~ ^wss:// ]]; then
    echo -e "${GREEN}✓${NC} URL starts with wss://"
else
    echo -e "${YELLOW}⚠${NC}  URL should start with wss://"
    echo "   Current: $LIVEKIT_URL"
fi

if [[ "$LIVEKIT_URL" =~ \.livekit\.cloud$ ]]; then
    echo -e "${GREEN}✓${NC} URL ends with .livekit.cloud"
else
    echo -e "${YELLOW}⚠${NC}  URL should end with .livekit.cloud"
fi
echo ""

# Extract project name from URL
if [[ "$LIVEKIT_URL" =~ wss://([^.]+)\.livekit\.cloud ]]; then
    PROJECT_NAME="${BASH_REMATCH[1]}"
    echo "Detected project: ${PROJECT_NAME}"
else
    echo -e "${YELLOW}⚠${NC}  Could not extract project name from URL"
fi
echo ""

# Check API key format
echo -e "${BLUE}3. Validating API Key format...${NC}"
if [[ "$LIVEKIT_KEY" =~ ^API ]]; then
    echo -e "${GREEN}✓${NC} API Key starts with 'API'"
else
    echo -e "${RED}❌ API Key should start with 'API'${NC}"
    echo "   Current: ${LIVEKIT_KEY:0:20}..."
    echo "   This might be the wrong value!"
fi

if [ ${#LIVEKIT_KEY} -gt 20 ]; then
    echo -e "${GREEN}✓${NC} API Key length looks reasonable (${#LIVEKIT_KEY} chars)"
else
    echo -e "${YELLOW}⚠${NC}  API Key seems short (${#LIVEKIT_KEY} chars)"
fi
echo ""

# Check secret format
echo -e "${BLUE}4. Validating API Secret format...${NC}"
if [ ${#LIVEKIT_SECRET} -gt 30 ]; then
    echo -e "${GREEN}✓${NC} API Secret length looks reasonable (${#LIVEKIT_SECRET} chars)"
else
    echo -e "${RED}❌ API Secret seems too short (${#LIVEKIT_SECRET} chars)${NC}"
    echo "   This might be incorrect!"
fi
echo ""

# Test token generation
echo -e "${BLUE}5. Testing token generation...${NC}"
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/livekit-token \
  -H "Content-Type: application/json" \
  -d '{"roomName":"test-room","participantName":"Test","interviewId":"test"}')

if echo "$TOKEN_RESPONSE" | grep -q '"token"'; then
    echo -e "${GREEN}✓${NC} Backend can generate tokens"
    
    # Extract token for inspection
    TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d '"' -f4)
    if [ ! -z "$TOKEN" ]; then
        echo "  Token preview: ${TOKEN:0:50}..."
        echo "  Token length: ${#TOKEN} chars"
    fi
else
    echo -e "${RED}❌ Token generation failed!${NC}"
    echo "  Response: $TOKEN_RESPONSE"
fi
echo ""

# Test LiveKit connectivity
echo -e "${BLUE}6. Testing LiveKit server connectivity...${NC}"

# Extract hostname from URL
if [[ "$LIVEKIT_URL" =~ wss://([^/]+) ]]; then
    LIVEKIT_HOST="${BASH_REMATCH[1]}"
    echo "Testing connection to: $LIVEKIT_HOST"
    
    # Try to resolve DNS
    if host "$LIVEKIT_HOST" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} DNS resolution successful"
    else
        echo -e "${YELLOW}⚠${NC}  DNS resolution failed or slow"
    fi
    
    # Try HTTP connection (will fail auth, but confirms server exists)
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${LIVEKIT_HOST}/settings/regions" -m 5)
    
    if [ "$HTTP_STATUS" == "401" ]; then
        echo -e "${GREEN}✓${NC} Server is reachable (401 = server exists, auth required)"
    elif [ "$HTTP_STATUS" == "000" ]; then
        echo -e "${RED}❌ Cannot reach LiveKit server (timeout)${NC}"
    else
        echo -e "${YELLOW}⚠${NC}  Unexpected status: $HTTP_STATUS"
    fi
fi
echo ""

# Final diagnosis
echo -e "${BLUE}7. Diagnosis Summary${NC}"
echo "===================="
echo ""

# Determine likely issue
ISSUE_FOUND=false

if [[ "$LIVEKIT_URL" == *"placeholder"* ]] || [[ "$LIVEKIT_KEY" == *"placeholder"* ]]; then
    echo -e "${RED}❌ PRIMARY ISSUE: Using placeholder credentials${NC}"
    echo ""
    echo "SOLUTION:"
    echo "  1. Go to https://livekit.io and sign up"
    echo "  2. Create a new project"
    echo "  3. Copy the credentials from Settings → Keys"
    echo "  4. Update your .env file"
    ISSUE_FOUND=true
fi

if ! echo "$TOKEN_RESPONSE" | grep -q '"token"' && [ "$ISSUE_FOUND" = false ]; then
    echo -e "${RED}❌ PRIMARY ISSUE: Token generation failing${NC}"
    echo ""
    echo "SOLUTION:"
    echo "  Check backend logs for errors"
    echo "  Verify all three values are set correctly"
    ISSUE_FOUND=true
fi

if [[ ! "$LIVEKIT_KEY" =~ ^API ]] && [ "$ISSUE_FOUND" = false ]; then
    echo -e "${RED}❌ PRIMARY ISSUE: API Key format is wrong${NC}"
    echo ""
    echo "Your API key should:"
    echo "  - Start with 'API'"
    echo "  - Look like: APIxxxxxxxxxxxxxxxx"
    echo ""
    echo "SOLUTION:"
    echo "  Go to LiveKit Dashboard → Settings → Keys"
    echo "  Copy the 'API Key' value (NOT the secret)"
    ISSUE_FOUND=true
fi

if [ "$HTTP_STATUS" == "401" ] && [ "$ISSUE_FOUND" = false ]; then
    echo -e "${YELLOW}⚠${NC}  LIKELY ISSUE: Credentials mismatch"
    echo ""
    echo "The server is reachable but rejecting your credentials."
    echo "This means:"
    echo "  - The URL points to a real LiveKit project"
    echo "  - But the API Key/Secret don't match that project"
    echo ""
    echo "SOLUTION:"
    echo "  1. Go to LiveKit Dashboard: https://cloud.livekit.io"
    echo "  2. Make sure you're in the correct project: $PROJECT_NAME"
    echo "  3. Go to Settings → Keys"
    echo "  4. Generate NEW credentials (if old ones expired)"
    echo "  5. Copy ALL THREE values:"
    echo "     - WebSocket URL"
    echo "     - API Key"
    echo "     - API Secret"
    echo "  6. Update .env file with ALL THREE"
    echo "  7. Restart backend: ./restart-all.sh"
    ISSUE_FOUND=true
fi

if [ "$ISSUE_FOUND" = false ]; then
    echo -e "${GREEN}✓${NC} Configuration looks correct!"
    echo ""
    echo "If you're still getting errors:"
    echo "  1. Restart backend: ./restart-all.sh"
    echo "  2. Clear browser cache"
    echo "  3. Try from different browser"
    echo "  4. Check LiveKit Dashboard for project status"
fi

echo ""
echo "=================================="
echo ""
echo "📚 For detailed help, see:"
echo "   FIX_LIVEKIT_ERROR.md"
echo ""
echo "🔗 LiveKit Dashboard:"
echo "   https://cloud.livekit.io"
echo ""
