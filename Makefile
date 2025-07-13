#--------------------------------------------------------------#
#                       VARIABLES                              #
#--------------------------------------------------------------#

PROJECT_NAME      = ft_transcendence
COMPOSE_FILE      = docker-compose.yml
COMPOSE_DEV_FILE  = docker-compose.dev.yml

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

.PHONY: all up down build logs stop re setup fclean clean restart dev dev-down dev-logs dev-build help

all: setup build up

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
	@echo "  $(YELLOW)make all$(RESET)      - Complete setup: environment + build + start all services"
	@echo "  $(YELLOW)make setup$(RESET)    - Initialize environment with centralized .env file"
	@echo "  $(YELLOW)make up$(RESET)       - Start all services"
	@echo "  $(YELLOW)make dev$(RESET)      - Start development environment"
	@echo ""
	@echo "$(GREEN)🔧 Development Commands:$(RESET)"
	@echo "  $(YELLOW)make build$(RESET)    - Build all Docker images"
	@echo "  $(YELLOW)make logs$(RESET)     - Show logs from all services"
	@echo "  $(YELLOW)make restart$(RESET)  - Restart all services (down + build + up)"
	@echo ""
	@echo "$(GREEN)🧹 Cleanup Commands:$(RESET)"
	@echo "  $(YELLOW)make down$(RESET)     - Stop all services"
	@echo "  $(YELLOW)make clean$(RESET)    - Stop services + prune unused Docker objects"
	@echo "  $(YELLOW)make fclean$(RESET)   - Complete cleanup (removes containers, volumes, data)"
	@echo "  $(YELLOW)make re$(RESET)       - Fresh restart (fclean + build + up)"
	@echo ""
	@echo "$(GREEN)🔗 Service URLs (when running):$(RESET)"
	@echo "  • Auth Service:  http://localhost:3001"
	@echo "  • Match Service: http://localhost:3002"
	@echo "  • User Service:  http://localhost:3003"
	@echo ""
