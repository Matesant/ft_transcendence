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
	@docker run --rm -v "$(shell pwd)/$(FRONTEND_DIR):/app" -w /app node:18 npm install
	@echo "$(GREEN)✅ Frontend dependencies installed!$(RESET)"

# Start frontend development
frontend-dev:
	@echo "$(CYAN)Starting frontend development...$(RESET)"
	@$(MAKE) kill-frontend
	@docker run --rm -v "$(shell pwd)/$(FRONTEND_DIR):/app" -w /app -d --name tailwind_watch node:18 npx tailwindcss -i src/style.css -o public/style.css --watch
	@docker run --rm -v "$(shell pwd)/$(FRONTEND_DIR):/app" -w /app -d --name frontend_dev -p 8080:8080 node:18 npm run start
	@echo "$(GREEN)✅ Frontend development started!$(RESET)"
	@echo "$(GREEN)🌐 Frontend available at: http://localhost:8080$(RESET)"

# Stop frontend processes
frontend-stop:
	@echo "$(YELLOW)Stopping frontend processes...$(RESET)"
	@docker stop tailwind_watch frontend_dev 2>/dev/null || true
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
	@docker rm -f $$(docker ps -aq) 2>/dev/null || true
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
