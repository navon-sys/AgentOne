#!/bin/bash

# AI Interview Platform - Backend Startup Script
# This script starts the Express API server and displays correct URLs

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║          🚀 Starting AI Interview Platform - Backend           ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Get network information
PRIVATE_IP=$(hostname -I | awk '{print $1}')
PUBLIC_IP="20.82.140.166"

echo "📡 Network Information:"
echo "   Private IP (Azure VNet): $PRIVATE_IP"
echo "   Public IP (Internet):    $PUBLIC_IP"
echo ""

echo "⏳ Starting Express API server..."
echo ""

# Start the server
npm run server
