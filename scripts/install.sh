#!/bin/bash

# ========================================
# SIP-ConnectyCube Bridge - Instalação Automatizada
# ========================================
# 
# Este script instala e configura automaticamente:
# - FreeSWITCH + FusionPBX
# - SIP-ConnectyCube Bridge
# - Firewall (UFW)
# - Monitoring básico
# - SSL automático (Let's Encrypt)
#
# Testado em: Ubuntu 20.04+ / Debian 11+
# Requisitos: Domínio DNS apontando para o servidor
#
# Uso: ./install.sh exemplo.com admin@exemplo.com
#

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Verificar parâmetros
if [ $# -lt 2 ]; then
    error "Uso: $0 <dominio> <email>"
    echo "Exemplo: $0 sip.minhaempresa.com admin@minhaempresa.com"
    exit 1
fi

DOMAIN=$1
EMAIL=$2
DB_PASSWORD=$(openssl rand -base64 32)
ADMIN_PASSWORD=$(openssl rand -base64 16)

# Banner
echo -e "${BLUE}"
cat << "EOF"
  ____  ___ ____      ____            _            
 / ___|/ _ \___ \    | __ ) _ __(_) __| | __ _  ___ 
 \___ \ | | |__) |   |  _ \| '__| |/ _` |/ _` |/ _ \
  ___) | |_| / __/    | |_) | |  | | (_| | (_| |  __/
 |____/ \___/_____|   |____/|_|  |_|\__,_|\__, |\___|
                                          |___/     
   ____                            _        ____      _          
  / ___|___  _ __  _ __   ___  ___| |_ _   _ / ___|   _| |__   ___ 
 | |   / _ \| '_ \| '_ \ / _ \/ __| __| | | | |  | | | | '_ \ / _ \
 | |__| (_) | | | | | | |  __/ (__| |_| |_| | |__| |_| | |_) |  __/
  \____\___/|_| |_|_| |_|\___|\___|\__|\__, |\____\__,_|_.__/ \___|
                                       |___/                      
EOF
echo -e "${NC}"

log "🚀 Iniciando instalação do SIP-ConnectyCube Bridge"
log "📡 Domínio: $DOMAIN"
log "📧 Email: $EMAIL"

# Verificar se é executado como root
if [ "$EUID" -ne 0 ]; then
    error "Execute como root: sudo $0 $DOMAIN $EMAIL"
fi

# Detectar OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    error "Sistema operacional não suportado"
fi

log "💻 Sistema: $OS $VER"

# Verificar se domínio aponta para este servidor
PUBLIC_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip)
DNS_IP=$(dig +short $DOMAIN | tail -n1)

if [ "$PUBLIC_IP" != "$DNS_IP" ]; then
    warning "⚠️  DNS não aponta para este servidor"
    warning "   Servidor: $PUBLIC_IP"
    warning "   DNS:      $DNS_IP"
    read -p "Continuar mesmo assim? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Configuração de DNS necessária"
    fi
fi

# ========================================
# 1. ATUALIZAR SISTEMA
# ========================================
log "📦 Atualizando sistema..."
apt update -qq
apt upgrade -y -qq
apt install -y curl wget gnupg2 software-properties-common ufw fail2ban htop

# ========================================
# 2. INSTALAR NODE.JS
# ========================================
log "📦 Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# ========================================
# 3. INSTALAR POSTGRESQL
# ========================================
log "🗄️  Instalando PostgreSQL..."
apt install -y postgresql postgresql-contrib

systemctl start postgresql
systemctl enable postgresql

# Configurar usuário do banco
sudo -u postgres createuser --pwprompt fusionpbx << EOF
$DB_PASSWORD
$DB_PASSWORD
EOF

sudo -u postgres createdb -O fusionpbx fusionpbx

# ========================================
# 4. INSTALAR FREESWITCH + FUSIONPBX
# ========================================
log "📞 Instalando FreeSWITCH + FusionPBX..."

# Adicionar repositório FreeSWITCH
wget -O - https://files.freeswitch.org/repo/deb/debian-release/fsstretch-archive-keyring.asc | apt-key add -
echo "deb https://files.freeswitch.org/repo/deb/debian-release/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/freeswitch.list

apt update -qq

# Instalar FreeSWITCH
apt install -y freeswitch-meta-all

# Clonar FusionPBX
cd /var/www
git clone https://github.com/fusionpbx/fusionpbx.git html
chown -R www-data:www-data /var/www/html

# Instalar Nginx
apt install -y nginx php7.4-fpm php7.4-cli php7.4-pgsql php7.4-curl php7.4-json php7.4-zip php7.4-xml php7.4-mbstring

# Configurar Nginx
cat > /etc/nginx/sites-available/fusionpbx << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    root /var/www/html;
    index index.php index.html index.htm;
    
    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }
    
    location ~ \.php\$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
    }
    
    location ~ /\.ht {
        deny all;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/fusionpbx /etc/nginx/sites-enabled/

systemctl restart nginx php7.4-fpm

# ========================================
# 5. INSTALAR SIP-CONNECTYCUBE BRIDGE
# ========================================
log "🌉 Instalando SIP-ConnectyCube Bridge..."

# Criar usuário para o bridge
useradd -r -s /bin/false sipbridge || true
mkdir -p /opt/sip-bridge
cd /opt/sip-bridge

# Clonar repositório
git clone https://github.com/Ineltec-Tecnologias-Ltda/sip-connectycube-bridge.git .
npm install
npm run build

# Criar arquivo de configuração
cat > /opt/sip-bridge/.env << EOF
NODE_ENV=production
SIP_SERVER=$DOMAIN
SIP_PORT=5060
CONNECTYCUBE_APP_ID=your_app_id
CONNECTYCUBE_AUTH_KEY=your_auth_key
CONNECTYCUBE_AUTH_SECRET=your_auth_secret
LOG_LEVEL=info
PORT=3000
EOF

chown -R sipbridge:sipbridge /opt/sip-bridge

# Criar serviço systemd
cat > /etc/systemd/system/sip-bridge.service << EOF
[Unit]
Description=SIP-ConnectyCube Bridge
After=network.target freeswitch.service
Wants=freeswitch.service

[Service]
Type=simple
User=sipbridge
Group=sipbridge
WorkingDirectory=/opt/sip-bridge
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=sip-bridge

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable sip-bridge

# ========================================
# 6. CONFIGURAR FIREWALL
# ========================================
log "🔒 Configurando firewall..."

ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# SSH
ufw allow 22/tcp

# HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# SIP
ufw allow 5060/udp
ufw allow 5060/tcp

# RTP
ufw allow 10000:20000/udp

# FusionPBX provisioning
ufw allow 9001/tcp

ufw --force enable

# ========================================
# 7. CONFIGURAR FAIL2BAN
# ========================================
log "🛡️  Configurando Fail2Ban..."

cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
maxretry = 3
bantime = 86400

[freeswitch]
enabled = true
port = 5060
protocol = udp
filter = freeswitch
logpath = /usr/local/freeswitch/log/freeswitch.log
maxretry = 3
bantime = 86400
EOF

# Criar filtro para FreeSWITCH
cat > /etc/fail2ban/filter.d/freeswitch.conf << EOF
[Definition]
failregex = ^.*sofia_reg_parse_auth.*\[WARNING\].*<HOST>.*$
ignoreregex =
EOF

systemctl restart fail2ban

# ========================================
# 8. CONFIGURAR SSL (LET'S ENCRYPT)
# ========================================
log "🔐 Configurando SSL com Let's Encrypt..."

apt install -y certbot python3-certbot-nginx

# Obter certificado
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

# Auto-renovação
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

# ========================================
# 9. CONFIGURAR USUÁRIOS SIP PADRÃO
# ========================================
log "👥 Configurando usuários SIP padrão..."

# Criar configuração de usuários
mkdir -p /usr/local/freeswitch/conf/directory/default

cat > /usr/local/freeswitch/conf/directory/default/vendas.xml << EOF
<include>
  <user id="vendas">
    <params>
      <param name="password" value="senha_vendas_123"/>
      <param name="vm-password" value="123"/>
    </params>
    <variables>
      <variable name="toll_allow" value="domestic,international,local"/>
      <variable name="accountcode" value="vendas"/>
      <variable name="user_context" value="default"/>
      <variable name="effective_caller_id_name" value="Vendas"/>
      <variable name="effective_caller_id_number" value="1001"/>
    </variables>
  </user>
</include>
EOF

cat > /usr/local/freeswitch/conf/directory/default/suporte.xml << EOF
<include>
  <user id="suporte">
    <params>
      <param name="password" value="senha_suporte_456"/>
      <param name="vm-password" value="456"/>
    </params>
    <variables>
      <variable name="toll_allow" value="domestic,international,local"/>
      <variable name="accountcode" value="suporte"/>
      <variable name="user_context" value="default"/>
      <variable name="effective_caller_id_name" value="Suporte"/>
      <variable name="effective_caller_id_number" value="1002"/>
    </variables>
  </user>
</include>
EOF

# ========================================
# 10. INICIAR SERVIÇOS
# ========================================
log "🔄 Iniciando serviços..."

systemctl restart freeswitch
systemctl enable freeswitch
sleep 5

systemctl start sip-bridge
sleep 3

# ========================================
# 11. VERIFICAR INSTALAÇÃO
# ========================================
log "🏥 Verificando instalação..."

# Verificar serviços
services=("nginx" "postgresql" "freeswitch" "sip-bridge" "fail2ban" "ufw")
for service in "${services[@]}"; do
    if systemctl is-active --quiet $service; then
        log "✅ $service: ATIVO"
    else
        error "❌ $service: INATIVO"
    fi
done

# Verificar portas
ports=("80" "443" "5060")
for port in "${ports[@]}"; do
    if netstat -tuln | grep -q ":$port "; then
        log "✅ Porta $port: ABERTA"
    else
        warning "⚠️  Porta $port: FECHADA"
    fi
done

# Verificar certificado SSL
if openssl x509 -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem -text -noout &>/dev/null; then
    log "✅ Certificado SSL: VÁLIDO"
else
    warning "⚠️  Certificado SSL: PROBLEMA"
fi

# ========================================
# 12. INFORMAÇÕES FINAIS
# ========================================
echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "${BLUE}📡 URLs de Acesso:${NC}"
echo "   • FusionPBX: https://$DOMAIN"
echo "   • SIP Bridge: https://$DOMAIN:3000"
echo
echo -e "${BLUE}👥 Usuários SIP Criados:${NC}"
echo "   • vendas@$DOMAIN (senha: senha_vendas_123)"
echo "   • suporte@$DOMAIN (senha: senha_suporte_456)"
echo
echo -e "${BLUE}🔧 Configurações:${NC}"
echo "   • Servidor SIP: $DOMAIN:5060"
echo "   • Base de dados: fusionpbx"
echo "   • Firewall: UFW ativo"
echo "   • SSL: Let's Encrypt"
echo "   • Fail2Ban: Ativo"
echo
echo -e "${BLUE}📋 Próximos Passos:${NC}"
echo "   1. Acesse https://$DOMAIN para configurar FusionPBX"
echo "   2. Configure as credenciais ConnectyCube em /opt/sip-bridge/.env"
echo "   3. Reinicie o bridge: systemctl restart sip-bridge"
echo "   4. Configure seus telefones SIP com as credenciais acima"
echo
echo -e "${BLUE}📊 Monitoramento:${NC}"
echo "   • Logs do Bridge: journalctl -u sip-bridge -f"
echo "   • Logs FreeSWITCH: tail -f /usr/local/freeswitch/log/freeswitch.log"
echo "   • Status dos serviços: systemctl status sip-bridge"
echo
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   • Altere as senhas padrão dos usuários SIP"
echo "   • Configure backup automático do banco de dados"
echo "   • Configure monitoring (Zabbix/Prometheus)"
echo "   • Teste as chamadas antes de usar em produção"
echo
echo -e "${GREEN}Documentação completa: https://github.com/Ineltec-Tecnologias-Ltda/sip-connectycube-bridge${NC}"
echo

# Salvar informações importantes
cat > /root/sip-bridge-info.txt << EOF
SIP-ConnectyCube Bridge - Informações da Instalação
==================================================

Data da instalação: $(date)
Domínio: $DOMAIN
Email: $EMAIL
IP Público: $PUBLIC_IP

Usuários SIP:
- vendas@$DOMAIN (senha: senha_vendas_123)
- suporte@$DOMAIN (senha: senha_suporte_456)

Banco de dados:
- Usuário: fusionpbx
- Senha: $DB_PASSWORD
- Base: fusionpbx

Arquivos importantes:
- Configuração Bridge: /opt/sip-bridge/.env
- Configuração Nginx: /etc/nginx/sites-available/fusionpbx
- Logs Bridge: journalctl -u sip-bridge -f
- Logs FreeSWITCH: tail -f /usr/local/freeswitch/log/freeswitch.log

URLs:
- FusionPBX: https://$DOMAIN
- SIP Bridge: https://$DOMAIN:3000

ALTERE AS SENHAS PADRÃO!
EOF

log "💾 Informações salvas em /root/sip-bridge-info.txt"
log "🎉 Instalação concluída! Acesse https://$DOMAIN para continuar."
