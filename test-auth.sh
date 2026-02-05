#!/bin/bash

# Test Script for HR Interview Platform
# This script tests the authentication fix

echo "🧪 Testing HR Interview Platform Authentication"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "1. Checking backend server..."
BACKEND_URL="http://localhost:3001"
if curl -s "${BACKEND_URL}/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend is running"
    
    # Check health status
    HEALTH=$(curl -s "${BACKEND_URL}/api/health")
    echo "   Health check response:"
    echo "   $HEALTH" | jq '.' 2>/dev/null || echo "   $HEALTH"
else
    echo -e "${RED}✗${NC} Backend is not running!"
    echo ""
    echo "   Please start the backend first:"
    echo "   npm run server"
    exit 1
fi

echo ""
echo "2. Testing user creation endpoint..."

# Generate test email
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="test123456"

echo "   Creating test user: $TEST_EMAIL"

# Create user
RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/admin/create-user" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}")

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓${NC} User created successfully!"
    echo "   Response:"
    echo "   $RESPONSE" | jq '.' 2>/dev/null || echo "   $RESPONSE"
else
    echo -e "${RED}✗${NC} User creation failed!"
    echo "   Response:"
    echo "   $RESPONSE" | jq '.' 2>/dev/null || echo "   $RESPONSE"
    
    # Check if it's because Supabase admin not configured
    if echo "$RESPONSE" | grep -q "Supabase admin not configured"; then
        echo ""
        echo -e "${YELLOW}⚠ ${NC} Please configure SUPABASE_SERVICE_ROLE_KEY in your .env file"
        echo "   See QUICK_SETUP.md for instructions"
    fi
    exit 1
fi

echo ""
echo "3. Summary"
echo "=========="
echo -e "${GREEN}✓${NC} Authentication system is working correctly!"
echo ""
echo "📝 Test credentials:"
echo "   Email:    $TEST_EMAIL"
echo "   Password: $TEST_PASSWORD"
echo ""
echo "🎉 You can now:"
echo "   1. Start the frontend: npm run dev"
echo "   2. Open http://localhost:5173"
echo "   3. Sign in with the test credentials above"
echo ""
echo "📚 For more information:"
echo "   - Setup guide: QUICK_SETUP.md"
echo "   - Detailed docs: FIX_SIGNUP_ERROR.md"
