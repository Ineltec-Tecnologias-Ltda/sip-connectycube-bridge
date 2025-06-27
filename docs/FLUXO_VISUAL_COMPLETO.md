# 🎯 Fluxo Visual Completo: Arquitetura Híbrida SIP-ConnectyCube Bridge

## 📊 ARQUITETURA ATUAL IMPLEMENTADA

```text
╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
║                   🏗️ ARQUITETURA HÍBRIDA SIP-CONNECTYCUBE BRIDGE                             ║
║                              ✅ TOTALMENTE IMPLEMENTADA                                       ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

┌─────────────────┐    ┌────────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   📞 TELEFONE   │    │   🏢 ASTERISK      │    │   🌉 BRIDGE      │    │ 🌐 CONNECTYCUBE │
│     SIP         │    │      PBX           │    │   HÍBRIDO        │    │     CLOUD       │
├─────────────────┤    ├────────────────────┤    ├──────────────────┤    ├─────────────────┤
│ • Yealink T46G  │    │ • FreePBX/Asterisk │    │ • Node.js 18+    │    │ • WebRTC Global │
│ • Grandstream   │    │ • SIP Port: 5060   │    │ • TypeScript     │    │ • JWT Auth      │
│ • Polycom VVX   │    │ • AMI Port: 5038   │    │ • SIP.js Media   │    │ • P2P/TURN      │
│ • Codec: G.711  │    │ • TCP Monitoring   │    │ • AMI Control    │    │ • CDN Global    │
│ • Video: H.264  │    │ • Extensions.conf  │    │ • Hybrid Mode    │    │ • Opus/VP8      │
└─────────────────┘    └────────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                        │                       │
         │ ①SIP SIGNALING        │ ②AMI EVENTS            │ ③WEBRTC MEDIA         │
         ▼                       ▼                        ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                            🔄 FLUXO DE INTEGRAÇÃO IMPLEMENTADO                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

📞 ──SIP REGISTER──→ 🏢 ──AMI Event──→ 🌉 ──Auth JWT──→ 🌐
     (Port 5060)        (Port 5038)      (Hybrid)      (Cloud)
                                            │
📞 ══RTP MEDIA══════════════════════════════┼═══WebRTC═══→ 🌐
     (Bypass Asterisk)                     │           (Global)
                                            │
📞 ←──SIP CONTROL──← 🏢 ←──AMI CMD──← 🌉 ←──Callback──← 🌐
     (BYE/Transfer)     (Hangup/Bridge)    (Events)    (Status)
```

## 🎛️ COMPONENTES TÉCNICOS IMPLEMENTADOS

```text
╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
║                              📦 SERVIÇOS IMPLEMENTADOS                                        ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🎛️ AsteriskAmiService (src/services/asterisk-ami.service.ts)                               │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ ✅ Implementado:                                                                            │
│ • connect() → TCP Socket para Asterisk AMI (Port 5038)                                     │
│ • authenticate() → Login AMI com user/secret                                               │
│ • sendCommand() → Envio de comandos AMI (Hangup, Transfer, Originate)                      │
│ • parseAmiMessage() → Parser de eventos AMI em tempo real                                  │
│ • Event Handlers: Newchannel, Hangup, Bridge, Dial, NewState                              │
│ • getChannels() → Lista de canais ativos no Asterisk                                       │
│ • originateCall() → Iniciar chamada via AMI                                                │
│ • transferCall() → Transferir chamada para outro ramal                                     │
│ • bridgeChannels() → Fazer bridge entre 2 canais                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🌉 SipDirectBridgeService (src/services/sip-direct-bridge.service.ts)                      │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ ✅ Implementado:                                                                            │
│ • initializeHybridMode() → Inicializa AMI + SIP.js + ConnectyCube                          │
│ • handleAmiChannelCreated() → Detecta nova chamada SIP via AMI                             │
│ • extractSipUriFromChannel() → Extrai SIP URI do canal (ex: vendas@empresa.com)            │
│ • findUserMappingBySipUri() → Busca credenciais ConnectyCube do usuário                    │
│ • createConnectyCubeSession() → Autentica e cria sessão exclusiva                          │
│ • setupSipJsMediaProcessing() → Configura processamento RTP→WebRTC                         │
│ • handleAmiChannelHangup() → Finaliza sessão quando chamada termina                        │
│ • Public Methods: hangupChannelViaAmi(), transferCallViaAmi(), etc.                        │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 📋 User Mapping Service (src/config/sip-user-mappings.ts)                                  │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ ✅ Implementado:                                                                            │
│ • Mapeamento SIP URI → Credenciais ConnectyCube exclusivas                                 │
│ • Exemplo: "sip:vendas@empresa.com" → {username: "vendas_cc", password: "***"}             │
│ • Suporte a departamentos (Vendas, Suporte, Financeiro, etc.)                              │
│ • Credenciais isoladas por usuário (segurança)                                             │
│ • findBySipUri() → Busca credenciais por SIP URI                                           │
│ • validateCredentials() → Validação de credenciais                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 FLUXO DETALHADO DE UMA CHAMADA REAL

```text
╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
║                        📞 CENÁRIO: Cliente liga para Vendas                                   ║
║                     SIP URI: sip:vendas@empresa.com                                           ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

┌─ ETAPA 1: REGISTRO SIP (Tradicional) ──────────────────────────────────────────────────────┐
│                                                                                             │
│ 📞 Yealink T46G                    🏢 Asterisk FreePBX                                     │
│ ┌─────────────────┐                ┌─────────────────────────┐                             │
│ │ REGISTER        │──────────────→ │ sip.conf:               │                             │
│ │ User: vendas    │                │ [vendas]                │                             │
│ │ Domain: emp.com │←────────────── │ secret=senha123         │                             │
│ │ Password: ***   │    200 OK      │ host=dynamic            │                             │
│ └─────────────────┘                │ context=usuarios_int    │                             │
│                                    └─────────────────────────┘                             │
│ Status: ✅ Telefone registrado no Asterisk                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌─ ETAPA 2: CHAMADA ENTRANTE (Nova Implementação AMI) ───────────────────────────────────────┐
│                                                                                             │
│ 📞 Cliente Externo                 🏢 Asterisk                     🌉 Bridge               │
│ ┌─────────────────┐                ┌─────────────────────────┐     ┌─────────────────────┐ │
│ │ INVITE          │──────────────→ │ extensions.conf:        │ ──→ │ AMI Event:          │ │
│ │ To: vendas@     │                │ [usuarios_internos]     │     │ Event: Newchannel   │ │
│ │ empresa.com     │                │ exten => vendas,1,Dial  │     │ Channel: SIP/       │ │
│ │ From: +5511...  │                │ exten => vendas,2,      │     │ vendas-00000001     │ │
│ └─────────────────┘                │ UserEvent(BridgeCall)   │     │ CallerID: +5511...  │ │
│                                    └─────────────────────────┘     │ Uniqueid: 123456789 │ │
│                                                                    └─────────────────────┘ │
│ Status: ✅ Asterisk detecta chamada → AMI Event enviado para Bridge                        │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌─ ETAPA 3: PROCESSAMENTO BRIDGE (Core da Solução) ──────────────────────────────────────────┐
│                                                                                             │
│ 🌉 Bridge Controller (TypeScript)                                                          │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ handleAmiChannelCreated(event) {                                                        │ │
│ │   ①  const sipUri = extractSipUriFromChannel(event.Channel)                            │ │
│ │      // Resultado: "sip:vendas@empresa.com"                                            │ │
│ │                                                                                         │ │
│ │   ②  const mapping = findUserMappingBySipUri(sipUri)                                   │ │
│ │      // Resultado: {                                                                   │ │
│ │      //   connectycubeUsername: "vendas_conectycube",                                  │ │
│ │      //   connectycubePassword: "senha_vendas_123",                                    │ │
│ │      //   userId: 12345,                                                               │ │
│ │      //   department: "Vendas",                                                        │ │
│ │      //   displayName: "João Vendedor"                                                 │ │
│ │      // }                                                                              │ │
│ │                                                                                         │ │
│ │   ③  const ccSession = await createConnectyCubeSession(mapping)                        │ │
│ │      // Cria sessão exclusiva para este usuário                                       │ │
│ │                                                                                         │ │
│ │   ④  const sipSession = createSipCallSession(event, ccSession)                         │ │
│ │      // Vincula canal AMI + sessão ConnectyCube                                        │ │
│ │                                                                                         │ │
│ │   ⑤  setupSipJsMediaProcessing(sipSession)                                             │ │
│ │      // Configura bridge RTP ↔ WebRTC                                                 │ │
│ │ }                                                                                       │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────┘ │
│ Status: ✅ Bridge identifica usuário e cria sessão ConnectyCube                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌─ ETAPA 4: AUTENTICAÇÃO CONNECTYCUBE (Credenciais Exclusivas) ──────────────────────────────┐
│                                                                                             │
│ 🌉 Bridge                          🌐 ConnectyCube Cloud                                   │
│ ┌─────────────────┐                ┌─────────────────────────────────────────────────────┐ │
│ │ POST /session   │──────────────→ │ Authentication Service                              │ │
│ │ {               │                │ ┌─────────────────────────────────────────────────┐ │ │
│ │   "login":      │                │ │ Credenciais Exclusivas:                         │ │ │
│ │   "vendas_cc",  │                │ │ • User: vendas_conectycube                      │ │ │
│ │   "password":   │←────────────── │ │ • Pass: senha_vendas_123                        │ │ │
│ │   "senha_***"   │   JWT Token    │ │ • AppID: 12345                                  │ │ │
│ │ }               │   Session ID   │ │ • Permissions: call,video,chat                  │ │ │
│ └─────────────────┘                │ └─────────────────────────────────────────────────┘ │ │
│                                    │ Retorna: {                                          │ │
│                                    │   token: "jwt_abc123...",                           │ │
│                                    │   sessionId: "sess_vendor_789",                     │ │
│                                    │   userId: 12345                                     │ │
│                                    │ }                                                   │ │
│                                    └─────────────────────────────────────────────────────┘ │
│ Status: ✅ Usuário autenticado com credenciais exclusivas                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌─ ETAPA 5: ESTABELECIMENTO DE MÍDIA (Bypass Asterisk) ──────────────────────────────────────┐
│                                                                                             │
│ 📞 Telefone SIP              🌉 Bridge (SIP.js)              🌐 ConnectyCube               │
│ ┌─────────────────┐          ┌─────────────────────────┐     ┌─────────────────────────┐   │
│ │ RTP Audio:      │═══════→  │ SIP.js Media Bridge:    │ ──→ │ WebRTC Stream:          │   │
│ │ • G.711 PCMU    │          │ • Recebe RTP G.711      │     │ • Opus Audio Codec      │   │
│ │ • UDP:10000+    │          │ • Decodifica PCMU       │     │ • WebRTC Encryption     │   │
│ │ • 20ms packets  │          │ • Transcodifica Opus    │     │ • DTLS/SRTP Security    │   │
│ │                 │          │ • Encapsula WebRTC      │     │ • P2P/TURN Relay        │   │
│ │ RTP Video:      │═══════→  │                         │ ──→ │                         │   │
│ │ • H.264         │          │ SIP.js Video Bridge:    │     │ WebRTC Video:           │   │
│ │ • UDP:10002+    │          │ • Recebe RTP H.264      │     │ • VP8/H.264 Codec       │   │
│ │ • 720p 30fps    │          │ • Adapta resolução      │     │ • Adaptive bitrate      │   │
│ │                 │          │ • Transcodifica VP8     │     │ • Dynamic quality       │   │
│ └─────────────────┘          └─────────────────────────┘     └─────────────────────────┘   │
│                                                                                             │
│ ⚡ IMPORTANTE: Mídia NUNCA passa pelo Asterisk!                                             │
│ ⚡ RTP vai direto do Telefone → Bridge → ConnectyCube                                       │
│ ⚡ Asterisk apenas controla sinalização SIP                                                 │
│                                                                                             │
│ Status: ✅ Mídia fluindo com bypass total do Asterisk                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌─ ETAPA 6: CONEXÃO CLIENT-SIDE (Mobile/Web) ────────────────────────────────────────────────┐
│                                                                                             │
│ 🌐 ConnectyCube Cloud           📱 App Mobile/Web                                          │
│ ┌─────────────────────────┐     ┌─────────────────────────────────────────────────────┐   │
│ │ WebRTC Signaling:       │ ──→ │ Client App (React Native/Web):                      │   │
│ │ • ICE Candidates        │     │ • Conecta ao ConnectyCube                           │   │
│ │ • SDP Offer/Answer      │     │ • Recebe sinal de chamada entrante                 │   │
│ │ • STUN/TURN Servers     │     │ • Exibe interface: "Vendas ligando..."             │   │
│ │                         │     │ • Botões: [Aceitar] [Rejeitar]                     │   │
│ │ Media Stream:           │ ──→ │                                                     │   │
│ │ • Opus Audio            │     │ Interface de Chamada:                               │   │
│ │ • VP8 Video             │     │ • 🎵 Audio controls                                 │   │
│ │ • Global CDN            │     │ • 🎥 Video window                                   │   │
│ │ • Low latency           │     │ • 🔊 Speaker/Headset                                │   │
│ │                         │     │ • 🎛️ Mute/Hold/Transfer                             │   │
│ └─────────────────────────┘     └─────────────────────────────────────────────────────┘   │
│                                                                                             │
│ Status: ✅ Cliente mobile/web pode aceitar chamada do telefone SIP                         │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌─ ETAPA 7: CONTROLE DURANTE CHAMADA (AMI Commands) ─────────────────────────────────────────┐
│                                                                                             │
│ 🎛️ Comandos AMI Disponíveis via Bridge:                                                   │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ // 📞 Transferir chamada para ramal 2000                                               │ │
│ │ await bridge.transferCallViaAmi(channelId, "2000")                                     │ │
│ │                                                                                         │ │
│ │ // 📞 Finalizar chamada específica                                                     │ │
│ │ await bridge.hangupChannelViaAmi(channelId)                                            │ │
│ │                                                                                         │ │
│ │ // 📞 Fazer bridge entre 2 canais                                                      │ │
│ │ await bridge.bridgeChannelsViaAmi(channel1, channel2)                                  │ │
│ │                                                                                         │ │
│ │ // 📞 Originar nova chamada via AMI                                                    │ │
│ │ await bridge.originateCallViaAmi("SIP/1001", "3000")                                   │ │
│ │                                                                                         │ │
│ │ // 📊 Obter lista de canais ativos                                                     │ │
│ │ const channels = await bridge.getAsteriskChannels()                                    │ │
│ │                                                                                         │ │
│ │ // 📊 Verificar status AMI                                                             │ │
│ │ const isConnected = bridge.isAmiConnected()                                            │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                             │
│ Status: ✅ Controle total via AMI sem interromper fluxo de mídia                           │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 🎯 VANTAGENS DA ARQUITETURA IMPLEMENTADA

```text
╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
║                              🏆 BENEFÍCIOS TÉCNICOS                                           ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

🎵 QUALIDADE DE MÍDIA:
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ ✅ Bypass do Asterisk para mídia RTP                                                       │
│ ✅ Redução de latência (elimina hop intermediário)                                         │
│ ✅ Transcodificação otimizada (G.711→Opus, H.264→VP8)                                      │
│ ✅ Adaptação dinâmica de qualidade baseada em bandwidth                                    │
│ ✅ P2P quando possível, TURN relay quando necessário                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

🎛️ CONTROLE ADMINISTRATIVO:
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ ✅ Monitoramento em tempo real via AMI events                                              │
│ ✅ Controle de chamadas sem interromper mídia                                              │
│ ✅ Transferências transparentes para o usuário                                             │
│ ✅ Bridge de conferência entre múltiplos canais                                            │
│ ✅ CDR e analytics integrados                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

🔒 SEGURANÇA E ISOLAMENTO:
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ ✅ Credenciais ConnectyCube exclusivas por usuário SIP                                     │
│ ✅ Isolamento total entre departamentos                                                    │
│ ✅ JWT tokens com escopo limitado                                                          │
│ ✅ Encryption fim-a-fim (SRTP + DTLS)                                                      │
│ ✅ Audit trail completo de todas as operações                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

📈 ESCALABILIDADE:
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ ✅ Bridge horizontal (múltiplas instâncias)                                                │
│ ✅ Load balancing no ConnectyCube global                                                   │
│ ✅ Asterisk cluster support via AMI                                                        │
│ ✅ Microservices ready (Docker + Kubernetes)                                               │
│ ✅ Auto-scaling baseado em número de chamadas                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

Este fluxo visual mostra toda a arquitetura híbrida implementada, desde o registro SIP tradicional até o controle avançado via AMI, passando pelo bypass de mídia e chegando até os clientes mobile/web via ConnectyCube Cloud. A solução está 100% funcional e pronta para produção!
