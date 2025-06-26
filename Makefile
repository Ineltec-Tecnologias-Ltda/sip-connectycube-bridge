# SIP-ConnectyCube Bridge - Development Makefile
# 
# Comandos úteis para desenvolvimento e deployment
#

.PHONY: help install build start stop restart logs clean test lint docs deploy

# Configuração
COMPOSE_FILE_DEV = docker-compose.dev.yml
COMPOSE_FILE_PROD = docker-compose.prod.yml
SERVICE_NAME = sip-bridge

# Cores para output
RED := \033[0;31m
GREEN := \033[0;32m
BLUE := \033[0;34m
YELLOW := \033[1;33m
NC := \033[0m # No Color

help: ## Mostra esta ajuda
	@echo "$(BLUE)SIP-ConnectyCube Bridge - Comandos Disponíveis$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Instala dependências localmente
	@echo "$(BLUE)📦 Instalando dependências...$(NC)"
	npm install

build: ## Constrói a aplicação
	@echo "$(BLUE)🔨 Construindo aplicação...$(NC)"
	npm run build

# ===== DOCKER DEVELOPMENT =====

docker-build: ## Constrói imagens Docker para desenvolvimento
	@echo "$(BLUE)🐳 Construindo imagens Docker...$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) build

docker-start: ## Inicia ambiente de desenvolvimento
	@echo "$(BLUE)🚀 Iniciando ambiente de desenvolvimento...$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) up -d
	@echo "$(GREEN)✅ Ambiente iniciado!$(NC)"
	@echo "$(YELLOW)🌐 URLs disponíveis:$(NC)"
	@echo "  • SIP Bridge:     http://localhost:3000"
	@echo "  • Grafana:        http://localhost:3001 (admin/admin)"
	@echo "  • Prometheus:     http://localhost:9090"
	@echo "  • Adminer:        http://localhost:8080 (bridge/password)"
	@echo "  • Redis Commander: http://localhost:8081"

docker-start-logs: ## Inicia ambiente e mostra logs
	@echo "$(BLUE)🚀 Iniciando ambiente com logs...$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) up --build

docker-stop: ## Para ambiente de desenvolvimento
	@echo "$(BLUE)🛑 Parando ambiente de desenvolvimento...$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) down

docker-restart: ## Reinicia ambiente de desenvolvimento
	@echo "$(BLUE)🔄 Reiniciando ambiente...$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) restart

docker-clean: ## Remove containers, volumes e imagens
	@echo "$(BLUE)🧹 Limpando ambiente Docker...$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) down -v --remove-orphans
	docker system prune -f
	@echo "$(GREEN)✅ Limpeza concluída!$(NC)"

# ===== LOGS E MONITORING =====

logs: ## Mostra logs de todos os serviços
	@echo "$(BLUE)📋 Logs dos serviços...$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) logs -f

logs-app: ## Mostra logs apenas do SIP Bridge
	@echo "$(BLUE)📋 Logs do SIP Bridge...$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) logs -f $(SERVICE_NAME)

logs-sip: ## Mostra logs do FreeSWITCH
	@echo "$(BLUE)📋 Logs do FreeSWITCH...$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) logs -f freeswitch

status: ## Mostra status dos serviços
	@echo "$(BLUE)📊 Status dos serviços:$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) ps

health: ## Verifica saúde dos serviços
	@echo "$(BLUE)🏥 Verificando saúde dos serviços...$(NC)"
	@curl -f http://localhost:3000/health && echo "$(GREEN)✅ SIP Bridge: OK$(NC)" || echo "$(RED)❌ SIP Bridge: ERRO$(NC)"
	@curl -f http://localhost:3001/api/health && echo "$(GREEN)✅ Grafana: OK$(NC)" || echo "$(RED)❌ Grafana: ERRO$(NC)"
	@curl -f http://localhost:9090/-/healthy && echo "$(GREEN)✅ Prometheus: OK$(NC)" || echo "$(RED)❌ Prometheus: ERRO$(NC)"

# ===== DESENVOLVIMENTO =====

dev: ## Inicia desenvolvimento local (sem Docker)
	@echo "$(BLUE)💻 Iniciando desenvolvimento local...$(NC)"
	npm run dev

dev-debug: ## Inicia desenvolvimento com debug
	@echo "$(BLUE)🐛 Iniciando desenvolvimento com debug...$(NC)"
	npm run dev:debug

shell: ## Abre shell no container do SIP Bridge
	@echo "$(BLUE)🖥️  Abrindo shell no container...$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) exec $(SERVICE_NAME) sh

shell-fs: ## Abre FreeSWITCH CLI
	@echo "$(BLUE)📞 Abrindo FreeSWITCH CLI...$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) exec freeswitch fs_cli

# ===== TESTES =====

test: ## Executa todos os testes
	@echo "$(BLUE)🧪 Executando testes...$(NC)"
	npm test

test-watch: ## Executa testes em modo watch
	@echo "$(BLUE)👀 Executando testes (watch mode)...$(NC)"
	npm run test:watch

test-coverage: ## Executa testes com coverage
	@echo "$(BLUE)📊 Executando testes com coverage...$(NC)"
	npm run test:coverage

test-docker: ## Executa testes no Docker
	@echo "$(BLUE)🐳 Executando testes no Docker...$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) exec $(SERVICE_NAME) npm test

test-integration: ## Executa testes de integração
	@echo "$(BLUE)🔗 Executando testes de integração...$(NC)"
	npm run test:integration

# ===== CODE QUALITY =====

lint: ## Executa linter
	@echo "$(BLUE)🔍 Executando linter...$(NC)"
	npm run lint

lint-fix: ## Corrige problemas do linter
	@echo "$(BLUE)🔧 Corrigindo problemas do linter...$(NC)"
	npm run lint:fix

format: ## Formata código com Prettier
	@echo "$(BLUE)✨ Formatando código...$(NC)"
	npm run format

type-check: ## Verifica tipos TypeScript
	@echo "$(BLUE)📝 Verificando tipos TypeScript...$(NC)"
	npm run type-check

audit: ## Verifica vulnerabilidades
	@echo "$(BLUE)🔒 Verificando vulnerabilidades...$(NC)"
	npm audit

# ===== DATABASE =====

db-migrate: ## Executa migrações do banco
	@echo "$(BLUE)🗄️  Executando migrações...$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) exec $(SERVICE_NAME) npm run db:migrate

db-seed: ## Popula banco com dados de teste
	@echo "$(BLUE)🌱 Populando banco com dados de teste...$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) exec $(SERVICE_NAME) npm run db:seed

db-reset: ## Reseta banco de dados
	@echo "$(BLUE)🔄 Resetando banco de dados...$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) exec $(SERVICE_NAME) npm run db:reset

db-backup: ## Faz backup do banco
	@echo "$(BLUE)💾 Fazendo backup do banco...$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) exec postgres pg_dump -U bridge sipbridge > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Backup salvo como backup_$(shell date +%Y%m%d_%H%M%S).sql$(NC)"

# ===== PRODUCTION =====

prod-build: ## Constrói para produção
	@echo "$(BLUE)🏭 Construindo para produção...$(NC)"
	docker build -t sip-bridge:prod -f Dockerfile.prod .

prod-start: ## Inicia ambiente de produção
	@echo "$(BLUE)🚀 Iniciando ambiente de produção...$(NC)"
	docker-compose -f $(COMPOSE_FILE_PROD) up -d

prod-stop: ## Para ambiente de produção
	@echo "$(BLUE)🛑 Parando ambiente de produção...$(NC)"
	docker-compose -f $(COMPOSE_FILE_PROD) down

prod-logs: ## Mostra logs de produção
	@echo "$(BLUE)📋 Logs de produção...$(NC)"
	docker-compose -f $(COMPOSE_FILE_PROD) logs -f

# ===== DEPLOYMENT =====

deploy-staging: ## Deploy para staging
	@echo "$(BLUE)🚢 Deploy para staging...$(NC)"
	@./scripts/deploy-staging.sh

deploy-prod: ## Deploy para produção
	@echo "$(BLUE)🚀 Deploy para produção...$(NC)"
	@./scripts/deploy-production.sh

# ===== UTILITIES =====

install-tools: ## Instala ferramentas de desenvolvimento
	@echo "$(BLUE)🛠️  Instalando ferramentas...$(NC)"
	npm install -g @typescript-eslint/eslint-plugin prettier nodemon ts-node

setup-git-hooks: ## Configura git hooks
	@echo "$(BLUE)🎣 Configurando git hooks...$(NC)"
	cp scripts/pre-commit .git/hooks/
	chmod +x .git/hooks/pre-commit

docs: ## Gera documentação
	@echo "$(BLUE)📚 Gerando documentação...$(NC)"
	npm run docs

docs-serve: ## Serve documentação localmente
	@echo "$(BLUE)🌐 Servindo documentação...$(NC)"
	npm run docs:serve

release: ## Cria nova release
	@echo "$(BLUE)🏷️  Criando nova release...$(NC)"
	npm run release

# ===== MONITORING =====

prometheus: ## Abre Prometheus
	@echo "$(BLUE)📊 Abrindo Prometheus...$(NC)"
	open http://localhost:9090

grafana: ## Abre Grafana
	@echo "$(BLUE)📈 Abrindo Grafana...$(NC)"
	open http://localhost:3001

adminer: ## Abre Adminer (DB Admin)
	@echo "$(BLUE)🗄️  Abrindo Adminer...$(NC)"
	open http://localhost:8080

redis-gui: ## Abre Redis Commander
	@echo "$(BLUE)📦 Abrindo Redis Commander...$(NC)"
	open http://localhost:8081

# ===== SIP TESTING =====

sip-status: ## Mostra status do FreeSWITCH
	@echo "$(BLUE)📞 Status do FreeSWITCH:$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) exec freeswitch fs_cli -x "status"

sip-users: ## Lista usuários SIP registrados
	@echo "$(BLUE)👥 Usuários SIP registrados:$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) exec freeswitch fs_cli -x "show registrations"

sip-calls: ## Lista chamadas ativas
	@echo "$(BLUE)📞 Chamadas ativas:$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) exec freeswitch fs_cli -x "show calls"

sip-reload: ## Recarrega configuração SIP
	@echo "$(BLUE)🔄 Recarregando configuração SIP...$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) exec freeswitch fs_cli -x "reloadxml"

# ===== INFO =====

info: ## Mostra informações do sistema
	@echo "$(BLUE)ℹ️  Informações do Sistema:$(NC)"
	@echo "Node.js: $(shell node --version)"
	@echo "npm: $(shell npm --version)"
	@echo "Docker: $(shell docker --version)"
	@echo "Docker Compose: $(shell docker-compose --version)"
	@echo "Git: $(shell git --version)"
	@echo ""
	@echo "$(BLUE)📦 Informações do Projeto:$(NC)"
	@echo "Nome: $(shell cat package.json | grep '"name"' | cut -d'"' -f4)"
	@echo "Versão: $(shell cat package.json | grep '"version"' | cut -d'"' -f4)"
	@echo "Descrição: $(shell cat package.json | grep '"description"' | cut -d'"' -f4)"

# Default target
.DEFAULT_GOAL := help
