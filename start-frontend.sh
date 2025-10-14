#!/bin/bash

# AI Interview Platform - Frontend Startup Script
# This script starts the Vite dev server and displays correct URLs

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║         🚀 Starting AI Interview Platform - Frontend           ║"
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

echo "⏳ Starting Vite development server..."
echo ""

# Start npm dev and capture output
npm run dev 2>&1 | while IFS= read -r line; do
    echo "$line"
    
    # When Vite shows the network URL, add our public IP info
    if echo "$line" | grep -q "Network:"; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🌐 ACCESS YOUR APPLICATION:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "   📱 From Internet (Share this URL):"
        echo "      http://$PUBLIC_IP:5173"
        echo ""
        echo "   🏠 From this VM (localhost):"
        echo "      http://localhost:5173"
        echo ""
        echo "   🔗 From Azure VNet (private network):"
        echo "      http://$PRIVATE_IP:5173"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
    fi
done
