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

.PHONY: all up down build logs stop re setup fclean clean restart

all: build up

## Main commands
up:
	@echo "$(CYAN)Starting all services...$(RESET)"
	docker compose -f $(COMPOSE_FILE) up -d
	@echo "$(YELLOW)Waiting for services to initialize...$(RESET)"
	@sleep 20
	@echo "$(CYAN)Setting up ELK configuration...$(RESET)"
	@chmod +x services/logs-service/scripts/setup-elasticseach-policies.sh services/logs-service/scripts/setup-kibana.sh
	@./services/logs-service/scripts/setup-elasticseach-policies.sh
	@curl -X PUT "localhost:9200/logstash-$(shell date +%Y.%m.%d)" \
		-H "Content-Type: application/json" \
		-d '{"settings":{"number_of_shards":1,"number_of_replicas":0}}' \
		2>/dev/null || true
	@./services/logs-service/scripts/setup-kibana.sh
	@echo "$(GREEN)✅ All services started!$(RESET)"
	@echo "$(CYAN)📊 Dashboard: http://localhost:5601/app/dashboards#/view/elk-dashboard$(RESET)"

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
	@rm -rf services/auth-service/data/*.db
	@rm -rf services/match-service/data/*.db
	@rm -rf services/user-service/data/*.db

re: fclean build up

setup:
	@echo "$(CYAN)Setting up environment files...$(RESET)"
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

