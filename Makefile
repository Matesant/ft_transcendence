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
RESET             = \033[0m

#--------------------------------------------------------------#
#                         TARGETS                              #
#--------------------------------------------------------------#

# Default target shows help
.DEFAULT_GOAL := help

.PHONY: all up down logs clean fclean re frontend-install frontend-dev frontend-stop kill-frontend help 

all: up frontend-install frontend-dev

# Start all backend services
up:
	@echo "$(CYAN)Starting backend services...$(RESET)"
	docker compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)✅ Backend services started!$(RESET)"

# Stop all services
down:
	@echo "$(RED)Stopping all services...$(RESET)"
	docker compose -f $(COMPOSE_FILE) down
	@$(MAKE) frontend-stop

# Show logs
logs:
	@echo "$(YELLOW)Showing logs from backend services...$(RESET)"
	docker compose -f $(COMPOSE_FILE) logs -f

# Install frontend dependencies
frontend-install:
	@echo "$(CYAN)Installing frontend dependencies...$(RESET)"
	@cd $(FRONTEND_DIR) && npm install
	@echo "$(GREEN)✅ Frontend dependencies installed!$(RESET)"

# Start frontend development
frontend-dev:
	@echo "$(CYAN)Starting frontend development...$(RESET)"
	@$(MAKE) kill-frontend
	@cd $(FRONTEND_DIR) && nohup npx tailwindcss -i src/style.css -o public/style.css --watch > .tailwind.log 2>&1 & echo $$! > .tailwind.pid
	@sleep 2
	@cd $(FRONTEND_DIR) && nohup npm run start > .frontend.log 2>&1 & echo $$! > .frontend.pid
	@echo "$(GREEN)✅ Frontend development started!$(RESET)"
	@echo "$(GREEN)🌐 Frontend available at: http://localhost:8080$(RESET)"

# Stop frontend processes
frontend-stop:
	@echo "$(YELLOW)Stopping frontend processes...$(RESET)"
	@if [ -f $(FRONTEND_DIR)/.tailwind.pid ]; then kill `cat $(FRONTEND_DIR)/.tailwind.pid` 2>/dev/null || true; rm -f $(FRONTEND_DIR)/.tailwind.pid; fi
	@if [ -f $(FRONTEND_DIR)/.frontend.pid ]; then kill `cat $(FRONTEND_DIR)/.frontend.pid` 2>/dev/null || true; rm -f $(FRONTEND_DIR)/.frontend.pid; fi
	@echo "$(GREEN)✅ Frontend processes stopped!$(RESET)"

# Kill processes on ports
kill-frontend:
	@-lsof -ti:8080 | xargs kill -9 2>/dev/null || true

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
re: fclean all
	@echo "$(GREEN)✅ Rebuild complete!$(RESET)"

help:
	@echo "$(CYAN)🚀 ft_transcendence - Available Commands$(RESET)"
	@echo ""
	@echo "$(GREEN)📋 Main Commands:$(RESET)"
	@echo "  $(YELLOW)make all$(RESET)              - Start everything (backend + frontend)"
	@echo "  $(YELLOW)make up$(RESET)               - Start backend services only"
	@echo "  $(YELLOW)make down$(RESET)             - Stop all services"
	@echo "  $(YELLOW)make logs$(RESET)             - Show backend logs"
	@echo ""
	@echo "$(GREEN)🎨 Frontend Commands:$(RESET)"
	@echo "  $(YELLOW)make frontend-install$(RESET) - Install frontend dependencies"
	@echo "  $(YELLOW)make frontend-dev$(RESET)     - Start frontend development"
	@echo "  $(YELLOW)make frontend-stop$(RESET)    - Stop frontend processes"
	@echo ""
	@echo "$(GREEN)🧹 Cleanup Commands:$(RESET)"
	@echo "  $(YELLOW)make clean$(RESET)            - Clean Docker resources"
	@echo "  $(YELLOW)make fclean$(RESET)           - Full cleanup (containers, volumes, data)"
	@echo "  $(YELLOW)make re$(RESET)               - Rebuild everything from scratch"
	@echo ""
	@echo "$(GREEN)🔗 Service URLs:$(RESET)"
	@echo "  • Frontend:      http://localhost:8080"
	@echo "  • Auth Service:  http://localhost:3001"
	@echo "  • Match Service: http://localhost:3002"
	@echo "  • User Service:  http://localhost:3003"
	@echo "  • Game Service:  http://localhost:3004"
	@echo ""
