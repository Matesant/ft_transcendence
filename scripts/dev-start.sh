#!/bin/bash

# Quick Development Start Script
# This script provides a quick way to start development

echo "🎮 ft_transcendence Quick Development Start"
echo "=========================================="

# Function to start backend in background
start_backend() {
    echo "🐳 Starting backend services..."
    docker-compose -f docker-compose.dev.yml up -d
    
    if [ $? -eq 0 ]; then
        echo "✅ Backend services started!"
        echo "Waiting for services to be ready..."
        sleep 5
        return 0
    else
        echo "❌ Failed to start backend services"
        return 1
    fi
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting frontend development server..."
    cd frontend
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies first..."
        npm install
    fi
    
    # Start frontend development server
    npm start
}

# Function to start frontend with CSS watch
start_frontend_with_css() {
    echo "🎨 Starting frontend with CSS watch mode..."
    cd frontend
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies first..."
        npm install
    fi
    
    # Start Tailwind CSS watch in background
    echo "🎨 Starting Tailwind CSS watch..."
    npx @tailwindcss/cli -i src/style.css -o public/style.css --watch &
    CSS_PID=$!
    
    # Start webpack dev server
    echo "🚀 Starting webpack dev server..."
    npm start
    
    # Cleanup CSS watch process when script exits
    trap "kill $CSS_PID 2>/dev/null" EXIT
}

# Menu for user choice
echo ""
echo "Choose your development setup:"
echo "1) Full stack (backend + frontend)"
echo "2) Frontend only (assumes backend is running)"
echo "3) Frontend with CSS watch (assumes backend is running)"
echo "4) Backend only"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "Starting full stack development..."
        if start_backend; then
            start_frontend
        fi
        ;;
    2)
        echo "Starting frontend only..."
        start_frontend
        ;;
    3)
        echo "Starting frontend with CSS watch..."
        start_frontend_with_css
        ;;
    4)
        echo "Starting backend only..."
        start_backend
        echo "Backend started! You can now start frontend separately."
        ;;
    *)
        echo "Invalid choice. Please run the script again."
        exit 1
        ;;
esac
