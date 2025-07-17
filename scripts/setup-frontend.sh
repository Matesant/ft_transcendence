#!/bin/bash

# Frontend Development Setup Script
# This script helps set up the frontend development environment

echo "🚀 ft_transcendence Frontend Setup"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed successfully!"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo ""
echo "🎯 Setup complete! You can now start development with:"
echo ""
echo "  make frontend-watch   - Start frontend with CSS watch mode"
echo "  make quick-backend    - Start backend services"
echo "  make fullstack-dev    - Start everything at once"
echo ""
echo "Or manually:"
echo "  npm start                                               - Start webpack-dev-server"
echo "  npx @tailwindcss/cli -i src/style.css -o public/style.css --watch  - Watch CSS changes"
echo ""
