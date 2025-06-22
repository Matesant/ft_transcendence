#--------------------------------------------------------------#
#                       VARIABLES                              #
#--------------------------------------------------------------#

PROJECT_NAME      = ft_transcendence
COMPOSE_FILE      = docker-compose.yml

# ELK services
ELK_SERVICES      = elasticsearch logstash kibana

# Terminal colors
GREEN             = \033[32m
RED               = \033[31m
CYAN              = \033[36m
YELLOW            = \033[33m
RESET             = \033[0m

#--------------------------------------------------------------#
#                         TARGETS                              #
#--------------------------------------------------------------#

.PHONY: all up down build logs stop re setup fclean clean \
        elk-up elk-down elk-logs

all: build up

## Backend (auth, match, game, user)
up:
	@echo "$(CYAN)Starting backend services...$(RESET)"
	docker compose -f $(COMPOSE_FILE) up -d auth-service match-service user-service

down stop:
	@echo "$(RED)Stopping backend services...$(RESET)"
	docker compose -f $(COMPOSE_FILE) stop auth-service match-service user-service

## ELK Stack
elk-up:
	@echo "$(CYAN)Starting ELK stack...$(RESET)"
	docker compose -f $(COMPOSE_FILE) up -d $(ELK_SERVICES)

elk-down:
	@echo "$(RED)Stopping ELK stack...$(RESET)"
	docker compose -f $(COMPOSE_FILE) stop $(ELK_SERVICES)

elk-logs:
	@echo "$(YELLOW)Tailing ELK logs...$(RESET)"
	docker compose -f $(COMPOSE_FILE) logs -f $(ELK_SERVICES)

## Combined logs
logs:
	docker compose -f $(COMPOSE_FILE) logs -f auth-service match-service game-service user-service

build:
	@echo "$(YELLOW)Building all images...$(RESET)"
	docker compose -f $(COMPOSE_FILE) build

clean: down
	@echo "$(RED)Pruning unused Docker objects...$(RESET)"
	docker system prune -f

fclean: clean
	@echo "$(RED)Pruning everything including volumes...$(RESET)"
	docker system prune -af --volumes
	@rm -rf services/auth-service/data/*.db
	@rm -rf services/match-service/data/*.db

re: fclean build up

setup:
	@for svc in auth-service match-service user-service; do \
		if [ ! -f services/$$svc/.env ]; then \
			echo "$(YELLOW)Creating .env for $$svc$(RESET)"; \
			mkdir -p services/$$svc/data; \
			echo "DB_PATH=./data/$$svc.db" > services/$$svc/.env; \
			echo "JWT_SECRET=jorge-super-secrets" >> services/$$svc/.env; \
			if [ "$$svc" = "auth-service" ]; then \
				echo "MAIL_USER=seu.email@gmail.com" >> services/$$svc/.env; \
				echo "MAIL_PASS=senha_de_app" >> services/$$svc/.env; \
			fi \
		fi \
	done
