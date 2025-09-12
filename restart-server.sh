#!/bin/bash

# Jargon Server Restart Script
# This script restarts the Jargon gateway server after configuration changes

echo "🔄 Restarting Jargon Gateway Server..."
echo "======================================="

# Kill any existing server processes
echo "🛑 Stopping existing server..."
pkill -f "gateway" || true
pkill -f "node.*gateway" || true

# Wait a moment for processes to stop
sleep 2

# Start the new server
echo "🚀 Starting server..."
cd apps/gateway
npm run dev &

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Check if server is running
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Server restarted successfully!"
    echo "🌐 Server running at: http://localhost:3001"
    echo "🖥️  Admin UI at: http://localhost:3000"
else
    echo "❌ Server failed to start. Check the logs above."
    exit 1
fi

echo ""
echo "🎉 Configuration changes applied!"
echo "==================================="
