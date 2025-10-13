#!/bin/bash

# LexChronos Real-Time Demo Startup Script

echo "🚀 Starting LexChronos Real-Time Legal Case Management System"
echo "============================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ to continue."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
    echo "✅ Node.js version $NODE_VERSION detected"
else
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to version 18 or higher."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies. Please check your network connection and try again."
        exit 1
    fi
    
    echo "✅ Dependencies installed successfully"
fi

# Check environment file
if [ ! -f ".env.local" ]; then
    echo "⚙️  Creating environment configuration..."
    cat > .env.local << EOF
# LexChronos Real-Time Configuration (Development)

# JWT Secret for Socket.io authentication
JWT_SECRET=lexchronos-demo-secret-key-change-in-production

# Server Configuration
PORT=3000
NODE_ENV=development

# WebSocket Configuration
SOCKET_IO_CORS_ORIGIN=http://localhost:3000

# Feature Flags (all enabled for demo)
ENABLE_DOCUMENT_COLLABORATION=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_REAL_TIME_SEARCH=true
ENABLE_ACTIVITY_FEED=true
ENABLE_PRESENCE_INDICATORS=true
EOF
    echo "✅ Environment configuration created"
fi

echo ""
echo "🌟 LexChronos Real-Time Features:"
echo "   • Real-time case updates"
echo "   • Live document collaboration"
echo "   • Instant notifications"
echo "   • Chat system with typing indicators"
echo "   • Timeline updates and deadline tracking"
echo "   • Presence indicators (who's online)"
echo "   • Live document editing status"
echo "   • Push notifications setup"
echo "   • Activity feed"
echo "   • Real-time search suggestions"
echo ""
echo "🚀 Starting the development server..."
echo "   Open http://localhost:3000 in your browser"
echo ""
echo "💡 Testing Tips:"
echo "   • Open multiple browser tabs to test real-time sync"
echo "   • Try different demo features from the navigation"
echo "   • Enable browser notifications for the full experience"
echo ""

# Start the server
npm run dev