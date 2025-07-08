#--------------------------------------------------------------#
#                       VARIABLES                              #
#--------------------------------------------------------------#

PROJECT_NAME      = ft_transcendence
COMPOSE_FILE      = docker-compose.yml

# Terminal colors
GREEN             = \033[32m
RED               = \033[31m
CYAN              = \033[36m
YELLOW            = \033[33m
RESET             = \033[0m

#--------------------------------------------------------------#
#                         TARGETS                              #
#--------------------------------------------------------------#

.PHONY: all up down build logs stop re setup fclean clean restart dev

all: build up

## Development - only services, no ELK
dev:
	@echo "$(CYAN)Starting development environment (no ELK)...$(RESET)"
	docker compose -f $(COMPOSE_FILE) up -d auth-service match-service user-service
	@echo "$(GREEN)✅ Development services started!$(RESET)"
	@echo "$(YELLOW)Services available:$(RESET)"
	@echo "  • Auth Service: http://localhost:3001"
	@echo "  • Match Service: http://localhost:3002"
	@echo "  • User Service: http://localhost:3003"

## Main command - full stack with ELK and logging
up:
	@echo "$(CYAN)Starting full stack with ELK and logging...$(RESET)"
	docker compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)✅ All services started!$(RESET)"
	@echo "$(CYAN)Setting up Kibana...$(RESET)"
	@chmod +x services/logs-service/scripts/setup-*.sh
	@./services/logs-service/scripts/setup-elasticseach-policies.sh || true
	@./services/logs-service/scripts/setup-kibana.sh || true
	@echo "$(GREEN)🎉 Everything ready!$(RESET)"
	@echo "$(CYAN)📊 Kibana: http://localhost:5601$(RESET)"

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

re: fclean build up

setup:
	@echo "$(CYAN)Setting up environment files...$(RESET)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)Creating main .env file$(RESET)"; \
		cp .env_sample .env; \
		echo "$(GREEN)✅ Main .env created from .env_sample$(RESET)"; \
		echo "$(YELLOW)⚠️  Please edit .env with your actual values$(RESET)"; \
	fi
	@for svc in auth-service match-service user-service; do \
		if [ ! -f services/$$svc/.env ]; then \
			echo "$(YELLOW)Creating .env for $$svc$(RESET)"; \
			mkdir -p services/$$svc/data; \
			echo "JWT_SECRET=your_secret" > services/$$svc/.env; \
			echo "AUTH_MAIL_USER=google-email" >> services/$$svc/.env; \
			echo "AUTH_MAIL_PASS=app password" >> services/$$svc/.env; \
			echo "AUTH_DB_PATH=./data/$$svc.db" >> services/$$svc/.env; \
			echo "USER_DB_PATH=./data/$$svc.db" >> services/$$svc/.env; \
			echo "MATCH_DB_PATH=./data/$$svc.db" >> services/$$svc/.env; \
			echo "LOG_LEVEL=info" >> services/$$svc/.env; \
		fi \
	done
