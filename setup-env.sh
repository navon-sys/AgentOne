#!/bin/bash

# Setup Script for HR Interview Platform
# This script helps you configure the .env file correctly

echo "🔧 HR Interview Platform - Environment Setup"
echo "=============================================="
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted. Keeping existing .env file."
        exit 0
    fi
fi

# Copy from example
cp .env.example .env

echo "📝 Created .env file from template"
echo ""
echo "⚠️  IMPORTANT: You need to configure your API keys"
echo ""
echo "📋 Required Configuration:"
echo ""
echo "1️⃣  Supabase Configuration"
echo "   Go to: https://supabase.com/dashboard"
echo "   → Select your project"
echo "   → Settings → API"
echo ""
echo "   ⚠️  CRITICAL: Use the CORRECT keys!"
echo ""
echo "   For Frontend (VITE_SUPABASE_ANON_KEY):"
echo "   ✅ Use: 'anon' key (public key)"
echo "   ❌ NOT: 'service_role' key"
echo ""
echo "   For Backend (SUPABASE_SERVICE_ROLE_KEY):"
echo "   ✅ Use: 'service_role' key (secret key)"
echo "   ⚠️  Keep this SECRET - never expose to browser!"
echo ""
echo "2️⃣  LiveKit Configuration (Optional)"
echo "   Go to: https://livekit.io"
echo "   → Create project"
echo "   → Get WebSocket URL and API credentials"
echo ""
echo "3️⃣  Deepgram Configuration (Optional)"
echo "   Go to: https://deepgram.com"
echo "   → Get API key"
echo ""
echo "4️⃣  OpenAI Configuration (Optional)"
echo "   Go to: https://platform.openai.com"
echo "   → Get API key"
echo ""
echo "📝 Edit the .env file now:"
echo "   nano .env"
echo "   OR"
echo "   vi .env"
echo ""
echo "🔍 After editing, verify your configuration:"
echo "   cat .env | grep -v '^#' | grep -v '^$'"
echo ""
echo "✅ Once configured, start the services:"
echo "   npm run server    # Terminal 1"
echo "   npm run dev       # Terminal 2"
echo ""
