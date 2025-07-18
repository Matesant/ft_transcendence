#--------------------------------------------------------------#
#                       VARIABLES                              #
#--------------------------------------------------------------#

PROJECT_NAME      = ft_transcendence
COMPOSE_FILE      = docker-compose.yml
COMPOSE_DEV_FILE  = docker-compose.dev.yml
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

.PHONY: all up down build logs stop re setup fclean clean restart dev dev-down dev-logs dev-build help 
.PHONY: frontend-dev frontend-build frontend-install frontend-watch frontend-tailwind
.PHONY: fullstack-dev quick-frontend quick-backend kill-ports force-restart

all: setup build up

## Frontend Development Commands
frontend-install:
	@echo "$(CYAN)📦 Installing frontend dependencies...$(RESET)"
	@cd frontend && npm install

frontend-dev:
	@echo "$(CYAN)🚀 Starting frontend development server...$(RESET)"
	@cd frontend && npm start

frontend-build:
	@echo "$(CYAN)🔨 Building frontend for production...$(RESET)"
	@cd frontend && npm run build

frontend-watch:
	@echo "$(CYAN)👀 Starting frontend with Tailwind CSS watch mode...$(RESET)"
	@echo "$(YELLOW)This will run both webpack-dev-server and tailwind watch concurrently$(RESET)"
	@cd frontend && \
		(npx @tailwindcss/cli -i src/style.css -o public/style.css --watch &) && \
		npm start

frontend-tailwind:
	@echo "$(CYAN)🎨 Building Tailwind CSS...$(RESET)"
	@cd frontend && npx @tailwindcss/cli -i src/style.css -o public/style.css

## Full Stack Development
fullstack-dev:
	@echo "$(BLUE)🚀 Starting full development environment...$(RESET)"
	@echo "$(YELLOW)1. Starting backend services...$(RESET)"
	@docker-compose up -d --build
	@echo "$(GREEN)✓ Backend services started$(RESET)"
	@echo "$(YELLOW)2. Waiting 5 seconds for services to initialize...$(RESET)"
	@sleep 5
	@echo "$(YELLOW)3. Building Tailwind CSS...$(RESET)"
	@cd $(FRONTEND_DIR) && npx @tailwindcss/cli -i src/style.css -o public/style.css
	@echo "$(YELLOW)4. Starting frontend with Tailwind watcher...$(RESET)"
	@cd $(FRONTEND_DIR) && \
		(npx @tailwindcss/cli -i src/style.css -o public/style.css --watch > /dev/null 2>&1 &) && \
		npm start

kill-ports:
	@echo "$(YELLOW)🔪 Killing processes on development ports...$(RESET)"
	@-lsof -ti:8080 | xargs kill -9 2>/dev/null || echo "$(GREEN)Port 8080 is free$(RESET)"
	@-lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "$(GREEN)Port 3001 is free$(RESET)"
	@-lsof -ti:3002 | xargs kill -9 2>/dev/null || echo "$(GREEN)Port 3002 is free$(RESET)"
	@-lsof -ti:3003 | xargs kill -9 2>/dev/null || echo "$(GREEN)Port 3003 is free$(RESET)"
	@-lsof -ti:3004 | xargs kill -9 2>/dev/null || echo "$(GREEN)Port 3004 is free$(RESET)"
	@echo "$(GREEN)✓ Port cleanup complete$(RESET)"

quick-frontend: frontend-tailwind frontend-dev
	@echo "$(GREEN)✓ Frontend ready for development$(RESET)"

quick-backend:
	@echo "$(BLUE)🚀 Starting backend services only...$(RESET)"
	@docker-compose up --build

force-restart: kill-ports
	@echo "$(RED)🔄 Force restarting everything...$(RESET)"
	@docker-compose down --remove-orphans
	@$(MAKE) fullstack-dev
	@echo "$(CYAN)🚀 Starting full development environment (backend + frontend)...$(RESET)"
	@echo "$(YELLOW)Starting backend services...$(RESET)"
	@docker compose -f $(COMPOSE_DEV_FILE) up -d
	@echo "$(YELLOW)Waiting for backend to be ready...$(RESET)"
	@sleep 5
	@echo "$(YELLOW)Starting frontend...$(RESET)"
	@cd frontend && npm start

## Quick Start Commands
quick-frontend:
	@echo "$(CYAN)⚡ Quick frontend start (assumes backend is running)...$(RESET)"
	@cd frontend && npm start

quick-backend:
	@echo "$(CYAN)⚡ Quick backend start (detached mode)...$(RESET)"
	@docker compose -f $(COMPOSE_DEV_FILE) up -d

## Development - services only
dev:
	@echo "$(CYAN)Starting development environment...$(RESET)"
	docker compose -f $(COMPOSE_DEV_FILE) up -d
	@echo "$(GREEN)✅ Development services started!$(RESET)"
	@echo "$(YELLOW)Services available:$(RESET)"
	@echo "  • Auth Service: http://localhost:3001"
	@echo "  • Match Service: http://localhost:3002"
	@echo "  • User Service: http://localhost:3003"

dev-down:
	@echo "$(RED)Stopping development services...$(RESET)"
	docker compose -f $(COMPOSE_DEV_FILE) down

dev-logs:
	@echo "$(YELLOW)Showing logs from development services...$(RESET)"
	docker compose -f $(COMPOSE_DEV_FILE) logs -f

dev-build:
	@echo "$(YELLOW)Building development images...$(RESET)"
	docker compose -f $(COMPOSE_DEV_FILE) build

## Main command - start all services
up:
	@echo "$(CYAN)Starting all services...$(RESET)"
	docker compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)✅ All services started!$(RESET)"

down stop:
	@echo "$(RED)Stopping all services...$(RESET)"
	docker compose -f $(COMPOSE_FILE) down

logs:
	@echo "$(YELLOW)Showing logs from all services...$(RESET)"
	docker compose -f $(COMPOSE_FILE) logs -f

build:
	@echo "$(YELLOW)Building all images...$(RESET)"
	docker compose -f $(COMPOSE_FILE) build

clean: down
	@echo "$(RED)Pruning unused Docker objects...$(RESET)"
	docker system prune -f

restart: down build up

fclean: down
	@echo "$(RED)Removing all containers and volumes...$(RESET)"
	docker compose -f $(COMPOSE_FILE) down --volumes --remove-orphans
	docker system prune -af --volumes
	@rm -rf services/*/data/*.db
	@echo "$(GREEN)✅ Complete cleanup finished!$(RESET)"

re: fclean build up

## Setup - Initialize environment with centralized .env
setup:
	@echo "$(CYAN)Setting up environment files...$(RESET)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)Creating main .env file$(RESET)"; \
		cp .env.sample .env; \
		echo "$(GREEN)✅ Main .env created from .env.sample$(RESET)"; \
		echo "$(YELLOW)⚠️  Please edit .env with your actual values$(RESET)"; \
	else \
		echo "$(GREEN)✅ Main .env already exists$(RESET)"; \
	fi
	@echo "$(CYAN)Creating data directories...$(RESET)"
	@for svc in auth-service match-service user-service; do \
		mkdir -p services/$$svc/data; \
		echo "$(GREEN)✅ Created data directory for $$svc$(RESET)"; \
	done
	@echo "$(GREEN)🎉 Setup complete! All services will use the centralized .env file$(RESET)"

## Help - Document all available commands
help:
	@echo "$(CYAN)🚀 ft_transcendence - Available Commands$(RESET)"
	@echo ""
	@echo "$(GREEN)📋 Main Commands:$(RESET)"
	@echo "  $(YELLOW)make all$(RESET)             - Complete setup: environment + build + start all services"
	@echo "  $(YELLOW)make setup$(RESET)           - Initialize environment with centralized .env file"
	@echo "  $(YELLOW)make up$(RESET)              - Start all services"
	@echo "  $(YELLOW)make dev$(RESET)             - Start development environment (backend only)"
	@echo "  $(YELLOW)make fullstack-dev$(RESET)   - Start full development environment (backend + frontend)"
	@echo ""
	@echo "$(GREEN)🎨 Frontend Commands:$(RESET)"
	@echo "  $(YELLOW)make frontend-install$(RESET) - Install frontend dependencies"
	@echo "  $(YELLOW)make frontend-dev$(RESET)     - Start frontend development server"
	@echo "  $(YELLOW)make frontend-build$(RESET)   - Build frontend for production"
	@echo "  $(YELLOW)make frontend-watch$(RESET)   - Start frontend with Tailwind CSS watch mode"
	@echo "  $(YELLOW)make quick-frontend$(RESET)   - Quick frontend start (backend must be running)"
	@echo "  $(YELLOW)make quick-backend$(RESET)    - Quick backend start (detached mode)"
	@echo ""
	@echo "$(GREEN)🔧 Development Commands:$(RESET)"
	@echo "  $(YELLOW)make build$(RESET)           - Build all Docker images"
	@echo "  $(YELLOW)make logs$(RESET)            - Show logs from all services"
	@echo "  $(YELLOW)make restart$(RESET)         - Restart all services (down + build + up)"
	@echo ""
	@echo "$(GREEN)🧹 Cleanup Commands:$(RESET)"
	@echo "  $(YELLOW)make down$(RESET)            - Stop all services"
	@echo "  $(YELLOW)make clean$(RESET)           - Stop services + prune unused Docker objects"
	@echo "  $(YELLOW)make fclean$(RESET)          - Complete cleanup (removes containers, volumes, data)"
	@echo "  $(YELLOW)make re$(RESET)              - Fresh restart (fclean + build + up)"
	@echo ""
	@echo "$(GREEN)🔗 Service URLs (when running):$(RESET)"
	@echo "  • Frontend:      http://localhost:8080"
	@echo "  • Auth Service:  http://localhost:3001"
	@echo "  • Match Service: http://localhost:3002"
	@echo "  • User Service:  http://localhost:3003"
	@echo "  • Game Service:  http://localhost:3004"
	@echo ""
	@echo "$(GREEN)⚡ Quick Start for Development:$(RESET)"
	@echo "  1. $(YELLOW)make frontend-install$(RESET)  - Install dependencies"
	@echo "  2. $(YELLOW)make fullstack-dev$(RESET)     - Start everything"
	@echo "  OR"
	@echo "  1. $(YELLOW)make quick-backend$(RESET)     - Start backend services"
	@echo "  2. $(YELLOW)make frontend-watch$(RESET)    - Start frontend with CSS watch"
	@echo ""
