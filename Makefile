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

.PHONY: all up down build logs stop re setup

all: build up

## Inicia os serviços em background
up:
	@echo "$(CYAN)Iniciando serviços...$(RESET)"
	docker-compose -f $(COMPOSE_FILE) up -d

## Executa build de todos os serviços
build:
	@echo "$(YELLOW)Buildando imagens dos microsserviços...$(RESET)"
	docker-compose -f $(COMPOSE_FILE) build

## Para os serviços
down stop:
	@echo "$(RED)Parando serviços...$(RESET)"
	docker-compose -f $(COMPOSE_FILE) down

## Limpa containers parados e redes não usadas
clean: down
	@echo "$(RED)Limpando recursos do Docker...$(RESET)"
	docker system prune -f

## Limpeza total: volumes + dados dos serviços
fclean: clean
	@echo "$(RED)Removendo volumes e dados locais...$(RESET)"
	docker system prune -af --volumes
	@docker run --rm -v $(shell pwd)/services/auth-service/data:/data busybox sh -c "rm -f /data/*.db"
	@docker run --rm -v $(shell pwd)/services/match-service/data:/data busybox sh -c "rm -f /data/*.db"

## Rebuild do zero
re: fclean build up

## Logs dos serviços
logs:
	docker-compose -f $(COMPOSE_FILE) logs -f

## Setup: cria .env padrão se não existir
setup:
	@for svc in auth-service match-service; do \
		if [ ! -f services/$$svc/.env ]; then \
			echo "$(YELLOW)Criando .env para $$svc$(RESET)"; \
			echo "DB_PATH=./data/$$svc.db" > services/$$svc/.env; \
			echo "JWT_SECRET=jorge-super-secrets" >> services/$$svc/.env; \
			if [ "$$svc" = "auth-service" ]; then \
				echo "MAIL_USER=seu.email@gmail.com" >> services/$$svc/.env; \
				echo "MAIL_PASS=senha_de_app" >> services/$$svc/.env; \
			fi \
		fi \
	done
