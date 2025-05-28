#--------------------------------------------------------------#
#                       VARIABLES                              #
#--------------------------------------------------------------#

PROJECT_NAME    = ft_transcendence
COMPOSE_FILE    = docker-compose.yml

# Cores para terminal
GREEN   = \033[32m
RED     = \033[31m
CYAN    = \033[36m
YELLOW  = \033[33m
RESET   = \033[0m

#--------------------------------------------------------------#
#                         TARGETS                              #
#--------------------------------------------------------------#

.PHONY: all up down build logs stop re setup fclean clean

all: build up

up:
	@echo "$(CYAN)Iniciando serviços...$(RESET)"
	docker compose -f $(COMPOSE_FILE) up -d

build:
	@echo "$(YELLOW)Buildando imagens dos microsserviços...$(RESET)"
	docker compose -f $(COMPOSE_FILE) build

down stop:
	@echo "$(RED)Parando serviços...$(RESET)"
	docker compose -f $(COMPOSE_FILE) down

clean: down
	@echo "$(RED)Limpando recursos do Docker...$(RESET)"
	docker system prune -f

fclean: clean
	@echo "$(RED)Removendo volumes e dados locais...$(RESET)"
	docker system prune -af --volumes
	@rm -rf services/auth-service/data/*.db
	@rm -rf services/match-service/data/*.db

re: fclean build up

logs:
	docker compose -f $(COMPOSE_FILE) logs -f

setup:
	@for svc in auth-service match-service game-service; do \
		if [ ! -f services/$$svc/.env ]; then \
			echo "$(YELLOW)Criando .env para $$svc$(RESET)"; \
			mkdir -p services/$$svc/data; \
			echo "DB_PATH=./data/$$svc.db" > services/$$svc/.env; \
			echo "JWT_SECRET=jorge-super-secrets" >> services/$$svc/.env; \
			if [ "$$svc" = "auth-service" ]; then \
				echo "MAIL_USER=seu.email@gmail.com" >> services/$$svc/.env; \
				echo "MAIL_PASS=senha_de_app" >> services/$$svc/.env; \
			fi \
		fi \
	done