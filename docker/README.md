# 🐳 SIP-ConnectyCube Bridge - Docker Guide

Este guia contém instruções para executar o SIP-ConnectyCube Bridge usando Docker em ambiente de desenvolvimento e produção.

## 📋 Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM disponível
- Portas disponíveis: 3000, 5060, 6379, 5432, 8080, 8081, 9090, 3001

## 🚀 Início Rápido - Desenvolvimento

### 1. Clone o repositório
```bash
git clone https://github.com/Ineltec-Tecnologias-Ltda/sip-connectycube-bridge.git
cd sip-connectycube-bridge
```

### 2. Configure as variáveis de ambiente
```bash
cp .env.example .env.docker
```

Edite o arquivo `.env.docker` com suas credenciais ConnectyCube:
```env
CONNECTYCUBE_APP_ID=sua_app_id
CONNECTYCUBE_AUTH_KEY=sua_auth_key
CONNECTYCUBE_AUTH_SECRET=seu_auth_secret
```

### 3. Inicie o ambiente de desenvolvimento
```bash
# Construir e iniciar todos os serviços
docker-compose -f docker-compose.dev.yml up --build

# Ou em background
docker-compose -f docker-compose.dev.yml up -d --build
```

### 4. Acesse os serviços

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| **SIP Bridge** | http://localhost:3000 | - |
| **Grafana** | http://localhost:3001 | admin/admin |
| **Prometheus** | http://localhost:9090 | - |
| **Adminer** | http://localhost:8080 | bridge/password |
| **Redis Commander** | http://localhost:8081 | - |

## 🔧 Configuração Detalhada

### Estrutura de Arquivos Docker
```
docker/
├── freeswitch-config/     # Configurações FreeSWITCH
├── grafana/
│   ├── dashboards/        # Dashboards Grafana
│   └── datasources/       # Configuração datasources
├── nginx.conf             # Configuração Nginx
├── prometheus.yml         # Configuração Prometheus
├── loki.yml              # Configuração Loki
├── promtail.yml          # Configuração Promtail
└── redis.conf            # Configuração Redis
```

### Configuração FreeSWITCH

Crie o diretório de configuração:
```bash
mkdir -p docker/freeswitch-config/directory/default
```

Exemplo de usuário SIP (`docker/freeswitch-config/directory/default/1001.xml`):
```xml
<include>
  <user id="1001">
    <params>
      <param name="password" value="1234"/>
      <param name="vm-password" value="1001"/>
    </params>
    <variables>
      <variable name="toll_allow" value="domestic,international,local"/>
      <variable name="accountcode" value="1001"/>
      <variable name="user_context" value="default"/>
      <variable name="effective_caller_id_name" value="Extension 1001"/>
      <variable name="effective_caller_id_number" value="1001"/>
    </variables>
  </user>
</include>
```

### Configuração Prometheus

`docker/prometheus.yml`:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'sip-bridge'
    static_configs:
      - targets: ['sip-bridge:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
```

### Configuração Nginx

`docker/nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream sip-bridge {
        server sip-bridge:3000;
    }

    server {
        listen 80;
        server_name localhost;

        location / {
            proxy_pass http://sip-bridge;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /ws {
            proxy_pass http://sip-bridge;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }
    }
}
```

## 🐛 Debug e Desenvolvimento

### Hot Reload
O código é montado como volume, permitindo hot reload:
```bash
# Edite qualquer arquivo TypeScript e veja as mudanças automaticamente
```

### Debug com VS Code
Adicione ao `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Docker: Attach to Node",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "address": "localhost",
      "localRoot": "${workspaceFolder}",
      "remoteRoot": "/app",
      "protocol": "inspector"
    }
  ]
}
```

### Logs
```bash
# Ver logs de todos os serviços
docker-compose -f docker-compose.dev.yml logs -f

# Ver logs específicos
docker-compose -f docker-compose.dev.yml logs -f sip-bridge
docker-compose -f docker-compose.dev.yml logs -f freeswitch

# Entrar no container
docker-compose -f docker-compose.dev.yml exec sip-bridge sh
```

## 🧪 Testes

### Executar testes no container
```bash
# Testes unitários
docker-compose -f docker-compose.dev.yml exec sip-bridge npm test

# Testes de integração
docker-compose -f docker-compose.dev.yml exec sip-bridge npm run test:integration

# Coverage
docker-compose -f docker-compose.dev.yml exec sip-bridge npm run test:coverage
```

### Teste de conectividade SIP
```bash
# Verificar se FreeSWITCH está respondendo
docker-compose -f docker-compose.dev.yml exec freeswitch fs_cli -x "status"

# Verificar usuários registrados
docker-compose -f docker-compose.dev.yml exec freeswitch fs_cli -x "show registrations"
```

## 📊 Monitoring

### Métricas Disponíveis
- **Application**: Health, response time, active calls
- **FreeSWITCH**: Registrations, calls, channels
- **System**: CPU, Memory, Network, Disk

### Dashboards Grafana
Dashboards pré-configurados:
- SIP Bridge Overview
- FreeSWITCH Metrics
- System Metrics
- Application Logs

## 🔒 Segurança

### Desenvolvimento
```bash
# Verificar vulnerabilidades
docker-compose -f docker-compose.dev.yml exec sip-bridge npm audit

# Scan de segurança
docker scout quickview
```

### Rede Isolada
Todos os containers executam em rede isolada `sip-bridge-net`.

## 🚀 Produção

### Build para produção
```bash
# Build da aplicação
docker build -t sip-bridge:prod -f Dockerfile.prod .

# Usar docker-compose para produção
docker-compose -f docker-compose.prod.yml up -d
```

### Otimizações de produção
- Multi-stage build
- Non-root user
- Health checks
- Resource limits
- Restart policies

## 📁 Volumes e Persistência

### Dados Persistentes
- `postgres-data`: Banco de dados
- `redis-data`: Cache Redis
- `grafana-data`: Configurações Grafana
- `prometheus-data`: Métricas históricas
- `loki-data`: Logs

### Backup
```bash
# Backup do banco
docker-compose -f docker-compose.dev.yml exec postgres pg_dump -U bridge sipbridge > backup.sql

# Backup de volumes
docker run --rm -v sip-bridge_postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

## 🛠️ Comandos Úteis

### Gerenciamento de containers
```bash
# Status dos serviços
docker-compose -f docker-compose.dev.yml ps

# Restart específico
docker-compose -f docker-compose.dev.yml restart sip-bridge

# Rebuild sem cache
docker-compose -f docker-compose.dev.yml build --no-cache sip-bridge

# Limpar tudo
docker-compose -f docker-compose.dev.yml down -v --remove-orphans
docker system prune -af
```

### Monitoramento de recursos
```bash
# Stats dos containers
docker stats

# Logs de sistema
docker-compose -f docker-compose.dev.yml exec sip-bridge dmesg

# Processos
docker-compose -f docker-compose.dev.yml exec sip-bridge ps aux
```

## 🆘 Troubleshooting

### Problemas Comuns

**1. Porta 5060 já em uso**
```bash
# Verificar qual processo está usando
sudo lsof -i :5060
# Parar processo ou alterar porta no docker-compose
```

**2. FreeSWITCH não inicia**
```bash
# Verificar logs
docker-compose -f docker-compose.dev.yml logs freeswitch
# Verificar configuração
docker-compose -f docker-compose.dev.yml exec freeswitch fs_cli -x "reloadxml"
```

**3. Bridge não conecta ao banco**
```bash
# Verificar se postgres está pronto
docker-compose -f docker-compose.dev.yml exec postgres pg_isready
# Verificar variáveis de ambiente
docker-compose -f docker-compose.dev.yml exec sip-bridge env | grep DATABASE
```

**4. Performance lenta**
```bash
# Aumentar recursos no docker-compose.yml
services:
  sip-bridge:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: "1.0"
```

### Health Checks
```bash
# Verificar saúde de todos os serviços
docker-compose -f docker-compose.dev.yml ps --format "table {{.Name}}\t{{.Status}}"

# Teste manual de conectividade
curl http://localhost:3000/health
```

## 📚 Documentação Adicional

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [FreeSWITCH Documentation](https://freeswitch.org/confluence/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)

---

Para mais informações, consulte o [README principal](../README.md) ou abra uma [issue](https://github.com/Ineltec-Tecnologias-Ltda/sip-connectycube-bridge/issues).
