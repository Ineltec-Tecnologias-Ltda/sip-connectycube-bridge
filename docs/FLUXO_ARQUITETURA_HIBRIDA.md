# 📊 Fluxo da Arquitetura Híbrida SIP-ConnectyCube Bridge

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           🏗️ ARQUITETURA HÍBRIDA IMPLEMENTADA                           │
│                      SIP.js (Mídia) + AMI (Controle) + ConnectyCube                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   📞 FONE SIP   │    │  🏢 ASTERISK PBX │    │ 🌉 SIP BRIDGE   │    │ 🌐 CONNECTYCUBE │
│                 │    │                  │    │                 │    │                 │
│ Yealink T46G    │    │ FreeSWITCH ou    │    │ Node.js + TS    │    │ WebRTC Cloud    │
│ Grandstream     │    │ Asterisk 18+     │    │ Híbrido Mode    │    │ Global CDN      │
│ Polycom VVX     │    │ Kamailio         │    │                 │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         │                       │                       │                       │
         ▼                       ▼                       ▼                       ▼

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  🔄 FLUXO DE DADOS                                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘

1️⃣ SINALIZAÇÃO SIP (Registro e Controle):
┌─────────────────┐    SIP REGISTER     ┌──────────────────┐
│   📞 Fone SIP   │ ──────────────────→ │  🏢 Asterisk     │
│   sip:1001@     │ ←────────────────── │  Port 5060       │
│   empresa.com   │    200 OK           │  UDP/TCP         │
└─────────────────┘                     └──────────────────┘

2️⃣ MONITORAMENTO AMI (Eventos de Sistema):
┌──────────────────┐    TCP Socket      ┌─────────────────┐
│  🏢 Asterisk     │    Port 5038       │ 🌉 Bridge       │
│  AMI Events:     │ ──────────────────→ │ AMI Service     │
│  • Newchannel    │ ←────────────────── │ Event Parser    │
│  • Hangup        │    AMI Commands    │ Channel Control │
│  • Bridge        │                    │                 │
│  • Dial          │                    │                 │
└──────────────────┘                    └─────────────────┘

3️⃣ MÍDIA RTP (Audio/Video - BYPASS do Asterisk):
┌─────────────────┐    RTP Packets     ┌─────────────────┐    WebRTC Stream   ┌─────────────────┐
│   📞 Fone SIP   │ ──────────────────→ │ 🌉 Bridge       │ ──────────────────→ │ 🌐 ConnectyCube │
│   G.711/H.264   │ ←────────────────── │ SIP.js Media    │ ←────────────────── │ Opus/VP8/H.264  │
│   UDP:10000+    │    Transcoded      │ RTP ↔ WebRTC    │    P2P/TURN        │ Global Relay    │
└─────────────────┘                    └─────────────────┘                    └─────────────────┘

4️⃣ MAPEAMENTO DE USUÁRIOS (SIP URI → ConnectyCube):
┌─────────────────┐                    ┌─────────────────┐                    ┌─────────────────┐
│ SIP URI         │                    │ Bridge Mapping  │                    │ ConnectyCube    │
│ sip:vendas@     │ ──────────────────→ │ Lookup Table    │ ──────────────────→ │ User: vendas_cc │
│ empresa.com     │                    │ Exclusive Creds │                    │ ID: 12345       │
└─────────────────┘                    └─────────────────┘                    └─────────────────┘
```

## 🎯 **FLUXO DETALHADO DE UMA CHAMADA**

```
📞 CENÁRIO: Cliente liga para sip:vendas@empresa.com

┌─ PASSO 1: REGISTRO SIP ─────────────────────────────────────────────────────────────────┐
│  📞 Fone (1001) ────SIP REGISTER───→ 🏢 Asterisk ────200 OK───→ 📞 Fone (registrado)   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─ PASSO 2: CHAMADA ENTRANTE ─────────────────────────────────────────────────────────────┐
│  📞 Cliente ────INVITE sip:vendas@empresa.com───→ 🏢 Asterisk                           │
│                                                    │                                    │
│                                                    ▼                                    │
│                                              extensions.conf:                           │
│                                              [usuarios_internos]                        │
│                                              exten => _X.,1,UserEvent(BridgeCall,...)   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─ PASSO 3: DETECÇÃO VIA AMI ─────────────────────────────────────────────────────────────┐
│  🏢 Asterisk ────AMI Event: Newchannel───→ 🌉 Bridge                                    │
│     Event: Newchannel                        │                                          │
│     Channel: SIP/vendas-00000001              ▼                                          │
│     CallerID: cliente_numero              handleAmiChannelCreated():                    │
│     UniqueID: 1234567890                  • extractSipUriFromChannel()                 │
│                                           • findUserMappingBySipUri()                  │
│                                           • Criar SipCallSession                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─ PASSO 4: MAPEAMENTO E LOOKUP ──────────────────────────────────────────────────────────┐
│  🌉 Bridge                                                                              │
│     SIP URI: "sip:vendas@empresa.com"                                                  │
│           ↓ findUserMappingBySipUri()                                                  │
│     Mapeamento encontrado:                                                              │
│     • ConnectyCube User: "vendas_conectycube"                                          │
│     • Password: "senha_vendas_123"                                                     │
│     • User ID: 12345                                                                   │
│     • Departamento: "Vendas"                                                           │
│     • Nome: "João Vendedor"                                                            │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─ PASSO 5: INICIAR SESSÃO CONNECTYCUBE ──────────────────────────────────────────────────┐
│  🌉 Bridge ────createUserSession()───→ 🌐 ConnectyCube                                  │
│     Credenciais exclusivas:               │                                            │
│     • username: vendas_conectycube         ▼                                            │
│     • password: senha_vendas_123       Autenticação JWT                                │
│                                        Criar sala WebRTC                               │
│                                        Retornar sessionId                              │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─ PASSO 6: ESTABELECER MÍDIA (BYPASS ASTERISK) ──────────────────────────────────────────┐
│  📞 Fone SIP ═══RTP G.711═══→ 🌉 Bridge ═══WebRTC Opus═══→ 🌐 ConnectyCube            │
│                                   │                                                    │
│                                   ▼                                                    │
│                              SIP.js Media:                                             │
│                              • Decodifica RTP                                          │
│                              • Transcodifica G.711→Opus                               │
│                              • Encapsula WebRTC                                        │
│                              • Envia para ConnectyCube                                 │
│                                                                                        │
│  🌐 ConnectyCube ═══WebRTC═══→ 📱 App Mobile/Web                                       │
│                                   Cliente final                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─ PASSO 7: CONTROLE DURANTE CHAMADA ─────────────────────────────────────────────────────┐
│  🎛️ Comandos disponíveis via AMI:                                                      │
│     • bridge.transferCallViaAmi(channel, "2000")                                      │
│     • bridge.hangupChannelViaAmi(channel)                                             │
│     • bridge.bridgeChannelsViaAmi(ch1, ch2)                                           │
│     • bridge.originateCallViaAmi("SIP/1001", "3000")                                  │
│                                                                                        │
│  📊 Monitoramento em tempo real:                                                       │
│     • bridge.getAsteriskChannels() → canais ativos                                    │
│     • bridge.getActiveSessions() → sessões bridge                                     │
│     • Events: channelCreated, channelHangup, bridgeEvent                              │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─ PASSO 8: FINALIZAÇÃO DA CHAMADA ───────────────────────────────────────────────────────┐
│  📞 Fone SIP ────BYE───→ 🏢 Asterisk ────AMI Hangup Event───→ 🌉 Bridge                │
│                              │                                  │                     │
│                              ▼                                  ▼                     │
│                         Canal removido                   handleAmiChannelHangup()     │
│                                                                  │                     │
│                                                                  ▼                     │
│                         🌉 Bridge ────endCallForSession()───→ 🌐 ConnectyCube          │
│                                                                  │                     │
│                                                                  ▼                     │
│                                                            Sessão finalizada           │
│                                                            CDR registrado              │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 **EVENTOS E HANDLERS IMPLEMENTADOS**

```
🎛️ AMI Events → Bridge Handlers:
┌──────────────────┐    ┌─────────────────────────────────────┐
│ Asterisk AMI     │    │ Bridge Event Handlers               │
├──────────────────┤    ├─────────────────────────────────────┤
│ Newchannel       │ ──→│ handleAmiChannelCreated()           │
│ Hangup           │ ──→│ handleAmiChannelHangup()            │
│ Bridge           │ ──→│ handleAmiBridgeEvent()              │
│ Dial             │ ──→│ handleAmiDialEvent()                │
│ NewState         │ ──→│ handleAmiChannelStateChange()       │
└──────────────────┘    └─────────────────────────────────────┘

🌐 ConnectyCube Events → Bridge Handlers:
┌──────────────────┐    ┌─────────────────────────────────────┐
│ ConnectyCube     │    │ Bridge Event Handlers               │
├──────────────────┤    ├─────────────────────────────────────┤
│ callAccepted     │ ──→│ handleConnectyCubeCallAccepted()    │
│ callRejected     │ ──→│ handleConnectyCubeCallRejected()    │
│ userHungUp       │ ──→│ handleConnectyCubeHangup()          │
│ remoteStream     │ ──→│ handleRemoteStreamReceived()        │
└──────────────────┘    └─────────────────────────────────────┘

📞 SIP.js Events → Bridge Handlers:
┌──────────────────┐    ┌─────────────────────────────────────┐
│ SIP.js (Futuro)  │    │ Bridge Event Handlers               │
├──────────────────┤    ├─────────────────────────────────────┤
│ invite           │ ──→│ handleIncomingSipCall()             │
│ bye              │ ──→│ handleSipHangup()                   │
│ ack              │ ──→│ handleSipAck()                      │
│ rtp              │ ──→│ handleRtpStream()                   │
└──────────────────┘    └─────────────────────────────────────┘
```

## 📊 **MÉTRICAS E MONITORAMENTO**

```
🎯 Dashborad em Tempo Real:
┌─────────────────────────────────────────────────────────────────┐
│                     📊 SIP BRIDGE STATUS                        │
├─────────────────────────────────────────────────────────────────┤
│ 🔗 Modo: HYBRID                          🟢 Status: ATIVO       │
│ 📞 AMI: ✅ Conectado (asterisk:5038)      📊 Canais: 3 ativos    │
│ 🌐 SIP: ✅ Registrado (sip.empresa.com)   🎵 Sessões: 2 ativas   │
│ 🚀 ConnectyCube: ✅ Online                ⏱️ Uptime: 2h 15m      │
├─────────────────────────────────────────────────────────────────┤
│ 📈 Estatísticas (últimos 30min):                               │
│ • Chamadas recebidas: 15                                       │
│ • Chamadas conectadas: 12 (80% taxa sucesso)                   │
│ • Tempo médio de estabelecimento: 2.3s                         │
│ • Qualidade média de áudio: 4.2/5.0                            │
│ • Transferências executadas: 3                                 │
├─────────────────────────────────────────────────────────────────┤
│ 🔧 Ações Disponíveis:                                          │
│ [Transfer] [Hangup] [Monitor] [Conference] [Analytics]         │
└─────────────────────────────────────────────────────────────────┘

🎵 Fluxo de Mídia (RTP Statistics):
┌─────────────────────────────────────────────────────────────────┐
│ Session: ami-1234567890 (Vendas → Cliente VIP)                 │
├─────────────────────────────────────────────────────────────────┤
│ 📊 Audio:                                                       │
│ • Codec: G.711 PCMU → Opus (Bridge transcode)                  │
│ • Packets: 2.5k sent, 2.4k received                            │
│ • Jitter: 12ms (Bom)                                           │
│ • Packet Loss: 0.1% (Excelente)                                │
│                                                                 │
│ 📺 Video:                                                       │
│ • Codec: H.264 → VP8 (Bridge transcode)                        │
│ • Resolution: 720p → 480p (Bandwidth adapt)                    │
│ • Bitrate: 512kbps → 256kbps                                   │
│ • Frame Rate: 30fps → 25fps                                    │
└─────────────────────────────────────────────────────────────────┘
```

Este gráfico mostra como a arquitetura híbrida implementada funciona na prática, com o AMI controlando o Asterisk, o SIP.js processando mídia e o ConnectyCube fornecendo WebRTC, tudo orquestrado pelo Bridge em Node.js/TypeScript.
