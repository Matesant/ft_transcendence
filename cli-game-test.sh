#!/bin/bash

# CLI Game Test Script for ft_transcendence
# This script demonstrates how to interact with the game service via REST API

BASE_URL="https://172.27.134.61:3004"
TEMP_DIR="/tmp/cli-game-test"
GAME_FILE="$TEMP_DIR/current_game.txt"
PLAYER_FILE="$TEMP_DIR/current_player.txt"

# Create temp directory if it doesn't exist
mkdir -p "$TEMP_DIR"

# Load saved game and player IDs if they exist
if [ -f "$GAME_FILE" ]; then
    GAME_ID=$(cat "$GAME_FILE" 2>/dev/null)
fi

if [ -f "$PLAYER_FILE" ]; then
    PLAYER_ID=$(cat "$PLAYER_FILE" 2>/dev/null)
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to save game state
save_game_state() {
    if [ -n "$GAME_ID" ]; then
        echo "$GAME_ID" > "$GAME_FILE"
    fi
    if [ -n "$PLAYER_ID" ]; then
        echo "$PLAYER_ID" > "$PLAYER_FILE"
    fi
}

# Function to clear game state
clear_game_state() {
    rm -f "$GAME_FILE" "$PLAYER_FILE"
    GAME_ID=""
    PLAYER_ID=""
}

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check service health
check_health() {
    print_status "Checking game service health..."
    response=$(curl -k -s "${BASE_URL}/health" 2>/dev/null)
    if [ $? -eq 0 ]; then
        print_success "Game service is running!"
        echo "Response: $response"
    else
        print_error "Game service is not accessible"
        exit 1
    fi
}

# Function to get game stats
get_stats() {
    print_status "Getting game statistics..."
    response=$(curl -k -s "${BASE_URL}/games/stats" 2>/dev/null)
    if [ $? -eq 0 ]; then
        print_success "Game stats retrieved:"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        print_error "Failed to get game stats"
    fi
}

# Function to create a new game
create_game() {
    print_status "Creating new game..."
    response=$(curl -k -s -X POST "${BASE_URL}/games/create" \
        -H "Content-Type: application/json" \
        -d '{"player1Name": "CLI_Player", "player2Name": "Bot"}' 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        GAME_ID=$(echo "$response" | jq -r '.gameId' 2>/dev/null)
        PLAYER_ID=$(echo "$response" | jq -r '.players.player1.id' 2>/dev/null)
        
        if [ "$GAME_ID" != "null" ] && [ "$GAME_ID" != "" ]; then
            save_game_state
            print_success "Game created successfully!"
            echo "Game ID: $GAME_ID"
            echo "Player ID: $PLAYER_ID"
            echo "Full Response: $response"
        else
            print_error "Failed to extract game ID from response"
            echo "Response: $response"
        fi
    else
        print_error "Failed to create game"
    fi
}

# Function to get game state
get_game_state() {
    if [ -z "$GAME_ID" ]; then
        print_error "No game ID available. Create a game first."
        return
    fi
    
    print_status "Getting game state for $GAME_ID..."
    response=$(curl -k -s "${BASE_URL}/games/${GAME_ID}/state" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        print_success "Game state retrieved:"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        print_error "Failed to get game state"
    fi
}

# Function to move paddle
move_paddle() {
    local direction=$1
    
    if [ -z "$GAME_ID" ] || [ -z "$PLAYER_ID" ]; then
        print_error "No game or player ID available. Create a game first."
        return
    fi
    
    if [ -z "$direction" ]; then
        print_error "Direction is required (up/down/stop)"
        return
    fi
    
    print_status "Moving paddle $direction..."
    response=$(curl -k -s -X POST "${BASE_URL}/games/${GAME_ID}/move" \
        -H "Content-Type: application/json" \
        -d "{\"playerId\": \"$PLAYER_ID\", \"direction\": \"$direction\"}" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        print_success "Paddle moved $direction"
        echo "Response: $response"
    else
        print_error "Failed to move paddle"
    fi
}

# Function to watch game (continuous state updates)
watch_game() {
    if [ -z "$GAME_ID" ]; then
        print_error "No game ID available. Create a game first."
        return
    fi
    
    print_status "Watching game $GAME_ID (Press Ctrl+C to stop)..."
    
    while true; do
        clear
        echo "=== GAME STATE MONITOR ==="
        echo "Game ID: $GAME_ID"
        echo "Player ID: $PLAYER_ID"
        echo "========================="
        
        response=$(curl -k -s "${BASE_URL}/games/${GAME_ID}/state" 2>/dev/null)
        if [ $? -eq 0 ]; then
            echo "$response" | jq '.' 2>/dev/null || echo "$response"
        else
            print_error "Failed to get game state"
            break
        fi
        
        echo ""
        echo "Commands: up, down, stop (in another terminal)"
        echo "Example: $0 move up"
        
        sleep 2
    done
}

# Function to end game
end_game() {
    if [ -z "$GAME_ID" ]; then
        print_error "No game ID available. Create a game first."
        return
    fi
    
    print_status "Ending game $GAME_ID..."
    response=$(curl -k -s -X DELETE "${BASE_URL}/games/${GAME_ID}" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        print_success "Game ended successfully"
        echo "Response: $response"
        clear_game_state
    else
        print_error "Failed to end game"
    fi
}

# Function to get current game info
get_current_game() {
    if [ -n "$GAME_ID" ]; then
        echo "Current Game ID: $GAME_ID"
        echo "Current Player ID: $PLAYER_ID"
    else
        echo "No active game"
    fi
}

# Function to show help
show_help() {
    echo "CLI Game Test Script for ft_transcendence"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  health          - Check game service health"
    echo "  stats           - Get game statistics"
    echo "  create          - Create a new game"
    echo "  state           - Get current game state"
    echo "  move <dir>      - Move paddle (up/down/stop)"
    echo "  watch           - Watch game state continuously"
    echo "  end             - End current game"
    echo "  info            - Show current game info"
    echo "  clear           - Clear saved game state"
    echo "  demo            - Run a complete demo"
    echo "  help            - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 create"
    echo "  $0 move up"
    echo "  $0 state"
    echo "  $0 watch"
    echo "  $0 info"
}

# Function to clear saved state
clear_state() {
    clear_game_state
    print_success "Game state cleared"
}

# Function to run a complete demo
run_demo() {
    print_status "Running complete game demo..."
    
    check_health
    echo ""
    
    get_stats
    echo ""
    
    create_game
    echo ""
    
    if [ -n "$GAME_ID" ]; then
        sleep 2
        get_game_state
        echo ""
        
        print_status "Moving paddle up..."
        move_paddle "up"
        sleep 1
        
        print_status "Moving paddle down..."
        move_paddle "down"
        sleep 1
        
        print_status "Stopping paddle..."
        move_paddle "stop"
        sleep 1
        
        echo ""
        get_game_state
        echo ""
        
        print_warning "Demo complete. Game is still running."
        print_status "Use '$0 watch' to monitor or '$0 end' to stop"
    fi
}

# Main script logic
case "$1" in
    "health")
        check_health
        ;;
    "stats")
        get_stats
        ;;
    "create")
        create_game
        ;;
    "state")
        get_game_state
        ;;
    "move")
        move_paddle "$2"
        ;;
    "watch")
        watch_game
        ;;
    "end")
        end_game
        ;;
    "info")
        get_current_game
        ;;
    "clear")
        clear_state
        ;;
    "demo")
        run_demo
        ;;
    "help"|*)
        show_help
        ;;
esac
