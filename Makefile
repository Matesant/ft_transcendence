#--------------------------------------------------------------#
#                       VARIABLES                              #
#--------------------------------------------------------------#

PROJECT_NAME      = ft_transcendence
COMPOSE_FILE      = docker-compose.yml
FRONTEND_DIR      = frontend

# Terminal colors
GREEN             = \033[32m
RED               = \033[31m
CYAN              = \033[36m
YELLOW            = \033[33m
BLUE              = \033[34m
RESET             = \033[0m

#--------------------------------------------------------------#
#                         TARGETS                              #
#--------------------------------------------------------------#

# Default target shows help
.DEFAULT_GOAL := help

.PHONY: all up down build logs stop clean fclean re frontend-install frontend-dev frontend-stop frontend-logs kill-frontend help 

all: build up kill-frontend frontend-install frontend-dev

# Start all backend services
up:
	@echo "$(CYAN)Starting backend services...$(RESET)"
	docker compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)✅ Backend services started!$(RESET)"

# Stop all services
down stop:
	@echo "$(RED)Stopping backend services...$(RESET)"
	docker compose -f $(COMPOSE_FILE) down
	@$(MAKE) frontend-stop

# Build Docker images
build:
	@echo "$(YELLOW)Building Docker images...$(RESET)"
	docker compose -f $(COMPOSE_FILE) build
	@echo "$(GREEN)✅ Build complete!$(RESET)"

# Show logs
logs:
	@echo "$(YELLOW)Showing logs from backend services...$(RESET)"
	docker compose -f $(COMPOSE_FILE) logs -f

# Install frontend dependencies
frontend-install:
	@echo "$(CYAN)Installing frontend dependencies...$(RESET)"
	cd $(FRONTEND_DIR) && npm install
	@echo "$(GREEN)✅ Frontend dependencies installed!$(RESET)"

# Start frontend development (CSS watch + dev server)
frontend-dev:
	@echo "$(CYAN)Starting frontend development...$(RESET)"
	@echo "$(YELLOW)Starting Tailwind CSS watch...$(RESET)"
	cd $(FRONTEND_DIR) && nohup npx tailwindcss -i src/style.css -o public/style.css --watch > .tailwind.log 2>&1 & echo $$! > .tailwind.pid
	@sleep 2
	@echo "$(YELLOW)Starting frontend server...$(RESET)"
	cd $(FRONTEND_DIR) && nohup npm run start > .frontend.log 2>&1 & echo $$! > .frontend.pid
	@echo "$(GREEN)✅ Frontend development started!$(RESET)"
	@echo "$(GREEN)🌐 Frontend available at: http://localhost:8080$(RESET)"
	@echo "$(BLUE)💡 Use 'make frontend-logs' to see frontend logs$(RESET)"

# Stop frontend processes
frontend-stop:
	@echo "$(YELLOW)Stopping frontend processes...$(RESET)"
	@if [ -f $(FRONTEND_DIR)/.tailwind.pid ]; then \
		kill `cat $(FRONTEND_DIR)/.tailwind.pid` 2>/dev/null || true; \
		rm -f $(FRONTEND_DIR)/.tailwind.pid; \
	fi
	@if [ -f $(FRONTEND_DIR)/.frontend.pid ]; then \
		kill `cat $(FRONTEND_DIR)/.frontend.pid` 2>/dev/null || true; \
		rm -f $(FRONTEND_DIR)/.frontend.pid; \
	fi
	@echo "$(GREEN)✅ Frontend processes stopped!$(RESET)"

# Show frontend logs
frontend-logs:
	@echo "$(CYAN)Frontend Logs:$(RESET)"
	@echo ""
	@if [ -f $(FRONTEND_DIR)/.frontend.log ]; then \
		echo "$(YELLOW)📱 Frontend Server Logs:$(RESET)"; \
		tail -n 20 $(FRONTEND_DIR)/.frontend.log; \
		echo ""; \
	else \
		echo "$(RED)❌ Frontend log file not found$(RESET)"; \
	fi
	@if [ -f $(FRONTEND_DIR)/.tailwind.log ]; then \
		echo "$(YELLOW)🎨 Tailwind CSS Logs:$(RESET)"; \
		tail -n 10 $(FRONTEND_DIR)/.tailwind.log; \
	else \
		echo "$(RED)❌ Tailwind log file not found$(RESET)"; \
	fi
	@echo ""
	@echo "$(BLUE)💡 Use 'tail -f frontend/.frontend.log' for live frontend logs$(RESET)"
	@echo "$(BLUE)💡 Use 'tail -f frontend/.tailwind.log' for live Tailwind logs$(RESET)"

# Kill processes on ports (alternative cleanup)
kill-frontend:
	@echo "$(YELLOW)Killing processes on frontend ports...$(RESET)"
	@-lsof -ti:8080 | xargs kill -9 2>/dev/null || echo "$(GREEN)Port 8080 is free$(RESET)"
	@echo "$(GREEN)✓ Port cleanup complete$(RESET)"

# Clean Docker resources
clean: down
	@echo "$(RED)Cleaning Docker resources...$(RESET)"
	docker system prune -f
	@echo "$(GREEN)✅ Cleanup complete!$(RESET)"

# Full cleanup
fclean: down
	@echo "$(RED)Full cleanup...$(RESET)"
	docker compose -f $(COMPOSE_FILE) down --volumes --remove-orphans
	docker system prune -af --volumes
	@rm -rf services/*/data/*.db
	@$(MAKE) frontend-stop
	@rm -f $(FRONTEND_DIR)/.frontend.log $(FRONTEND_DIR)/.tailwind.log
	@echo "$(GREEN)✅ Full cleanup complete!$(RESET)"

# Rebuild everything from scratch
re: fclean all kill-frontend
	@echo "$(GREEN)Rebuilding everything...$(RESET)"
	@$(MAKE) all
	@echo "$(GREEN)✅ Rebuild complete!$(RESET)"

help:
	@echo "$(CYAN)🚀 ft_transcendence - Available Commands$(RESET)"
	@echo ""
	@echo "$(GREEN)📋 Main Commands:$(RESET)"
	@echo "  $(YELLOW)make all$(RESET)              - Build backend + start everything (backend + frontend)"
	@echo "  $(YELLOW)make up$(RESET)               - Start backend services only"
	@echo "  $(YELLOW)make down$(RESET)             - Stop all services (backend + frontend)"
	@echo ""
	@echo "$(GREEN)🎨 Frontend Commands:$(RESET)"
	@echo "  $(YELLOW)make frontend-install$(RESET) - Install frontend dependencies (npm install)"
	@echo "  $(YELLOW)make frontend-dev$(RESET)     - Start frontend (Tailwind CSS watch + dev server)"
	@echo "  $(YELLOW)make frontend-stop$(RESET)    - Stop frontend processes"
	@echo "  $(YELLOW)make frontend-logs$(RESET)    - Show frontend logs (server + Tailwind)"
	@echo ""
	@echo "$(GREEN)🔧 Backend Commands:$(RESET)"
	@echo "  $(YELLOW)make build$(RESET)            - Build Docker images"
	@echo "  $(YELLOW)make logs$(RESET)             - Show backend logs"
	@echo ""
	@echo "$(GREEN)🧹 Cleanup Commands:$(RESET)"
	@echo "  $(YELLOW)make clean$(RESET)            - Stop services + clean Docker resources"
	@echo "  $(YELLOW)make fclean$(RESET)           - Full cleanup (containers, volumes, data, frontend)"
	@echo "  $(YELLOW)make re$(RESET)               - Rebuild everything from scratch (fclean + all)"
	@echo "  $(YELLOW)make kill-frontend$(RESET)    - Force kill processes on port 8080"
	@echo ""
	@echo "$(GREEN)🔗 Service URLs (when running):$(RESET)"
	@echo "  • Frontend:      http://localhost:8080"
	@echo "  • Auth Service:  http://localhost:3001"
	@echo "  • Match Service: http://localhost:3002"
	@echo "  • User Service:  http://localhost:3003"
	@echo "  • Game Service:  http://localhost:3004"
	@echo ""
	@echo "$(GREEN)⚡ Quick Start:$(RESET)"
	@echo "  $(YELLOW)make all$(RESET)              - Start everything!"
	@echo ""
