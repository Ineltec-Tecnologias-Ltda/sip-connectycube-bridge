/**
 * Configurações de Servidores SIP para SIP-ConnectyCube Bridge
 * 
 * Este arquivo contém exemplos de configuração para diferentes servidores SIP
 */

// ===== FREESWITCH + FUSIONPBX (RECOMENDADO) =====

export const FREESWITCH_CONFIG = {
  name: "FreeSWITCH + FusionPBX",
  description: "Melhor opção para auto-hospedagem",
  pros: [
    "Open Source gratuito",
    "Alta performance",
    "Interface web (FusionPBX)",
    "WebRTC nativo",
    "Configuração simplificada"
  ],
  
  // Configuração para directory/default.xml
  userConfig: `
<!-- Usuário SIP para Vendas -->
<user id="vendas_sip">
  <params>
    <param name="password" value="senha_vendas_123"/>
    <param name="vm-password" value="123"/>
  </params>
  <variables>
    <variable name="toll_allow" value="domestic,international,local"/>
    <variable name="accountcode" value="vendas"/>
    <variable name="user_context" value="default"/>
    <variable name="effective_caller_id_name" value="João Vendas"/>
    <variable name="effective_caller_id_number" value="1001"/>
  </variables>
</user>

<!-- Usuário SIP para Suporte -->
<user id="suporte_sip">
  <params>
    <param name="password" value="senha_suporte_456"/>
    <param name="vm-password" value="456"/>
  </params>
  <variables>
    <variable name="toll_allow" value="domestic,international,local"/>
    <variable name="accountcode" value="suporte"/>
    <variable name="user_context" value="default"/>
    <variable name="effective_caller_id_name" value="Maria Suporte"/>
    <variable name="effective_caller_id_number" value="1002"/>
  </variables>
</user>
  `,
  
  installation: {
    ubuntu: `
# Instalação FreeSWITCH + FusionPBX no Ubuntu
cd /usr/src
git clone https://github.com/fusionpbx/fusionpbx-install.sh.git
cd fusionpbx-install.sh/ubuntu
chmod +x install.sh
./install.sh

# Após instalação, acesse:
# https://seu-ip/
# Usuário: admin
# Senha: gerada durante instalação
    `
  }
};

// ===== ASTERISK + FREEPBX =====

export const ASTERISK_CONFIG = {
  name: "Asterisk + FreePBX",
  description: "Opção popular com interface web",
  pros: [
    "Comunidade gigante",
    "Interface FreePBX",
    "Muitos módulos",
    "Bem documentado"
  ],
  
  // Configuração sip.conf
  sipConfig: `
[general]
context=default
allowoverlap=no
udpbindaddr=0.0.0.0
tcpenable=no
tcpbindaddr=0.0.0.0
transport=udp
srvlookup=yes
allowguest=no

; Configurações NAT
nat=force_rport,comedia
externip=SEU_IP_PUBLICO
localnet=192.168.1.0/255.255.255.0

; Codecs
allow=all
disallow=all
allow=ulaw
allow=alaw
allow=gsm
allow=g722
allow=g729

; Usuário Vendas
[vendas_sip]
type=friend
secret=senha_vendas_123
host=dynamic
qualify=yes
nat=force_rport,comedia
context=from-internal
mailbox=1001

; Usuário Suporte  
[suporte_sip]
type=friend
secret=senha_suporte_456
host=dynamic
qualify=yes
nat=force_rport,comedia
context=from-internal
mailbox=1002
  `,
  
  installation: {
    ubuntu: `
# Instalação Asterisk + FreePBX
sudo apt update
sudo apt install asterisk
wget http://mirror.freepbx.org/modules/packages/freepbx/freepbx-15.0-latest.tgz
tar xfz freepbx-15.0-latest.tgz
cd freepbx
./install -n
    `
  }
};

// ===== TWILIO ELASTIC SIP TRUNKING =====

export const TWILIO_CONFIG = {
  name: "Twilio Elastic SIP Trunking",
  description: "Solução em nuvem totalmente gerenciada",
  pros: [
    "Sem servidor para manter",
    "Escalabilidade automática",
    "Global (números mundo todo)",
    "API simples",
    "Confiabilidade alta"
  ],
  
  // Configuração para SIP-ConnectyCube Bridge
  bridgeConfig: {
    sip: {
      domain: 'sip.twilio.com',
      port: 5060,
      transport: 'UDP',
      username: 'sua_conta_twilio',
      password: 'seu_auth_token',
      registrar: 'sip.twilio.com:5060'
    }
  },
  
  setup: `
1. Crie conta Twilio (https://twilio.com)
2. Vá para Elastic SIP Trunking
3. Crie um SIP Domain
4. Configure Credential Lists
5. Adicione usuários SIP
6. Configure no bridge
  `
};

// ===== KAMAILIO (ALTA PERFORMANCE) =====

export const KAMAILIO_CONFIG = {
  name: "Kamailio",
  description: "Para alta performance e grandes volumes",
  pros: [
    "Ultra performance",
    "Até milhões de usuários",
    "Proxy SIP puro",
    "Muito configurável"
  ],
  
  basicConfig: `
# Configuração básica kamailio.cfg
#!KAMAILIO

####### Global Parameters #########
debug=2
log_stderror=no
log_facility=LOG_LOCAL0
fork=yes
children=4

listen=udp:0.0.0.0:5060

####### Modules Section ########
loadmodule "sl.so"
loadmodule "tm.so"
loadmodule "rr.so"
loadmodule "maxfwd.so"
loadmodule "usrloc.so"
loadmodule "registrar.so"
loadmodule "textops.so"
loadmodule "siputils.so"

####### Routing Logic ########
route {
    if (!mf_process_maxfwd_header("10")) {
        sl_send_reply("483","Too Many Hops");
        exit;
    }

    if (is_method("REGISTER")) {
        if (!save("location")) {
            sl_reply_error();
        }
        exit;
    }

    if (!lookup("location")) {
        sl_send_reply("404", "Not Found");
        exit;
    }

    if (!t_relay()) {
        sl_reply_error();
    }
}
  `,
  
  installation: {
    ubuntu: `
sudo apt update
sudo apt install kamailio kamailio-mysql-modules
sudo systemctl enable kamailio
sudo systemctl start kamailio
    `
  }
};

// ===== CONFIGURAÇÃO DOCKER =====

export const DOCKER_CONFIGS = {
  freeswitch: `
# docker-compose.yml para FreeSWITCH
version: '3.8'
services:
  freeswitch:
    image: drachtio/freeswitch:latest
    ports:
      - "5060:5060/udp"
      - "5080:5080/tcp"
      - "8021:8021/tcp"
      - "10000-20000:10000-20000/udp"
    environment:
      - MOD_EVENT_SOCKET_PASSWORD=ClueCon
    volumes:
      - ./freeswitch/conf:/usr/local/freeswitch/conf
      - ./freeswitch/logs:/usr/local/freeswitch/log
  `,
  
  asterisk: `
# docker-compose.yml para Asterisk
version: '3.8'
services:
  asterisk:
    image: respoke/asterisk
    ports:
      - "5060:5060/udp"
      - "10000-20000:10000-20000/udp"
    volumes:
      - ./asterisk/conf:/etc/asterisk
      - ./asterisk/sounds:/var/lib/asterisk/sounds
      - ./asterisk/logs:/var/log/asterisk
  `
};

// ===== HELPER FUNCTIONS =====

export function getRecommendedServer(useCase: string) {
  const recommendations = {
    'startup': TWILIO_CONFIG,
    'small-business': FREESWITCH_CONFIG,
    'enterprise': KAMAILIO_CONFIG,
    'development': FREESWITCH_CONFIG,
    'production': FREESWITCH_CONFIG
  };
  
  return recommendations[useCase as keyof typeof recommendations] || FREESWITCH_CONFIG;
}

export function validateSipConfig(config: any) {
  const required = ['domain', 'port', 'username', 'password'];
  return required.every(field => config[field]);
}

export const SIP_SERVER_PORTS = {
  sip_udp: 5060,
  sip_tcp: 5060,
  sip_tls: 5061,
  rtp_start: 10000,
  rtp_end: 20000,
  websocket: 8088,
  wss: 8089
};

/**
 * Configuração recomendada para firewall
 */
export const FIREWALL_RULES = {
  ufw: [
    'sudo ufw allow 5060/udp',
    'sudo ufw allow 5060/tcp', 
    'sudo ufw allow 5061/tcp',
    'sudo ufw allow 10000:20000/udp',
    'sudo ufw allow 8088/tcp',
    'sudo ufw allow 8089/tcp'
  ],
  
  iptables: [
    'iptables -A INPUT -p udp --dport 5060 -j ACCEPT',
    'iptables -A INPUT -p tcp --dport 5060 -j ACCEPT',
    'iptables -A INPUT -p tcp --dport 5061 -j ACCEPT',
    'iptables -A INPUT -p udp --dport 10000:20000 -j ACCEPT'
  ]
};
