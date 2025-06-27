# 🎯 Diagrama de Fluxo: Arquitetura Híbrida SIP-ConnectyCube Bridge

## 📊 Visão Geral da Arquitetura

```mermaid
graph TB
    subgraph "🏢 INFRAESTRUTURA SIP"
        Phone["📞 Fone SIP<br/>Yealink/Grandstream"]
        Asterisk["🏢 Asterisk PBX<br/>Port 5060 (SIP)<br/>Port 5038 (AMI)"]
    end
    
    subgraph "🌉 SIP-CONNECTYCUBE BRIDGE"
        AMI["🎛️ AMI Service<br/>Event Monitoring<br/>Call Control"]
        SipJS["🎵 SIP.js Service<br/>Media Processing<br/>RTP ↔ WebRTC"]
        Mapping["📋 User Mapping<br/>SIP URI → ConnectyCube<br/>Exclusive Credentials"]
        Bridge["🌉 Bridge Controller<br/>Hybrid Orchestration"]
    end
    
    subgraph "🌐 CONNECTYCUBE CLOUD"
        CC_Auth["🔐 Authentication<br/>JWT Tokens"]
        CC_WebRTC["📡 WebRTC Service<br/>P2P/TURN Relay"]
        CC_Stream["🎥 Media Streams<br/>Opus/VP8/H.264"]
    end
    
    subgraph "📱 CLIENT APPS"
        Mobile["📱 Mobile App<br/>iOS/Android"]
        Web["💻 Web App<br/>React/Vue/Angular"]
    end
    
    %% SIP Signaling Flow
    Phone -->|"1. SIP REGISTER"| Asterisk
    Phone -->|"2. SIP INVITE"| Asterisk
    Asterisk -->|"3. AMI Events<br/>TCP:5038"| AMI
    
    %% Media Flow (bypasses Asterisk)
    Phone -.->|"4. RTP Media<br/>BYPASS Asterisk"| SipJS
    
    %% Bridge Processing
    AMI --> Bridge
    SipJS --> Bridge
    Bridge --> Mapping
    
    %% ConnectyCube Integration
    Bridge -->|"5. Authenticate<br/>Exclusive Creds"| CC_Auth
    Bridge -->|"6. Create Session"| CC_WebRTC
    SipJS -->|"7. WebRTC Stream"| CC_Stream
    
    %% Client Connection
    CC_Stream --> Mobile
    CC_Stream --> Web
    
    style Phone fill:#e1f5fe
    style Asterisk fill:#fff3e0
    style Bridge fill:#e8f5e8
    style CC_WebRTC fill:#f3e5f5
    style Mobile fill:#fce4ec
    style Web fill:#fce4ec
```

## 🔄 Fluxo de Uma Chamada Completa

```mermaid
sequenceDiagram
    participant Phone as 📞 Fone SIP
    participant Asterisk as 🏢 Asterisk
    participant AMI as 🎛️ AMI Service
    participant Bridge as 🌉 Bridge
    participant Mapping as 📋 Mapping
    participant SipJS as 🎵 SIP.js
    participant CC as 🌐 ConnectyCube
    participant App as 📱 Client App
    
    Note over Phone,App: 🚀 INÍCIO DA CHAMADA
    
    Phone->>Asterisk: 1. SIP REGISTER (sip:vendas@empresa.com)
    Asterisk->>Phone: 200 OK (Registered)
    
    Phone->>Asterisk: 2. INVITE (Nova chamada)
    Asterisk->>AMI: 3. AMI Event: Newchannel
    
    AMI->>Bridge: 4. handleAmiChannelCreated()
    Bridge->>Mapping: 5. findUserMappingBySipUri()
    Mapping->>Bridge: 6. Return: {username: vendas_cc, userId: 12345}
    
    Bridge->>CC: 7. Authenticate (exclusive credentials)
    CC->>Bridge: 8. JWT Token + Session ID
    
    Note over Phone,SipJS: 🎵 MÍDIA BYPASS (RTP direto)
    Phone-->>SipJS: 9. RTP Audio/Video (G.711/H.264)
    SipJS-->>Phone: 10. RTP Response
    
    SipJS->>CC: 11. WebRTC Stream (Opus/VP8)
    CC->>App: 12. P2P/TURN WebRTC
    
    Note over Phone,App: ✅ CHAMADA ESTABELECIDA
    
    App->>CC: 13. Answer Call
    CC->>SipJS: 14. Accept Signal
    SipJS->>Bridge: 15. callAccepted event
    Bridge->>AMI: 16. Monitor call status
    
    Note over Phone,App: 🎛️ CONTROLE DURANTE CHAMADA
    
    opt Transfer Call
        Bridge->>AMI: transferCallViaAmi(channel, "2000")
        AMI->>Asterisk: AMI: Redirect
    end
    
    opt Hangup
        Phone->>Asterisk: BYE
        Asterisk->>AMI: AMI Event: Hangup
        AMI->>Bridge: handleAmiChannelHangup()
        Bridge->>CC: endCallForSession()
        CC->>App: Call Ended
    end
```

## 🏗️ Arquitetura de Componentes

```mermaid
graph LR
    subgraph "🎛️ CONTROL LAYER (AMI)"
        AMI_Connect["AMI Connection<br/>TCP Socket"]
        AMI_Parser["Event Parser<br/>Newchannel, Hangup, etc"]
        AMI_Commands["Call Control<br/>Transfer, Bridge, etc"]
    end
    
    subgraph "🎵 MEDIA LAYER (SIP.js)"
        RTP_Decode["RTP Decoder<br/>G.711, G.722, H.264"]
        Transcode["Media Transcode<br/>SIP ↔ WebRTC"]
        WebRTC_Encode["WebRTC Encoder<br/>Opus, VP8, VP9"]
    end
    
    subgraph "🔗 BRIDGE LAYER"
        Session_Mgr["Session Manager<br/>Active Calls"]
        User_Map["User Mapping<br/>SIP → ConnectyCube"]
        Event_Router["Event Router<br/>AMI + SIP + CC"]
    end
    
    subgraph "🌐 CONNECTYCUBE LAYER"
        CC_Auth["Authentication<br/>JWT + Exclusive Creds"]
        CC_Session["Session Management<br/>WebRTC Rooms"]
        CC_Relay["Media Relay<br/>P2P/TURN"]
    end
    
    AMI_Connect --> AMI_Parser
    AMI_Parser --> Event_Router
    Event_Router --> Session_Mgr
    
    RTP_Decode --> Transcode
    Transcode --> WebRTC_Encode
    WebRTC_Encode --> CC_Relay
    
    Session_Mgr --> User_Map
    User_Map --> CC_Auth
    CC_Auth --> CC_Session
    
    Event_Router --> AMI_Commands
```

## 📊 Separação de Responsabilidades

```mermaid
pie title Responsabilidades dos Componentes
    "🎛️ AMI: Controle" : 25
    "🎵 SIP.js: Mídia" : 35
    "🌉 Bridge: Orquestração" : 25
    "🌐 ConnectyCube: WebRTC" : 15
```

## 🔄 Estados de Uma Sessão

```mermaid
stateDiagram-v2
    [*] --> Ringing: AMI: Newchannel
    Ringing --> Connecting: Bridge: User Mapped
    Connecting --> Connected: ConnectyCube: Call Accepted
    Connected --> Transferring: AMI: Transfer Request
    Transferring --> Connected: Transfer Complete
    Connected --> Ended: AMI: Hangup Event
    Connecting --> Ended: Call Rejected/Timeout
    Ended --> [*]
    
    note right of Connected
        🎵 Mídia fluindo:
        RTP ↔ WebRTC
        Estatísticas ativas
    end note
    
    note right of Transferring
        🎛️ Controle AMI:
        Redirect command
        Bridge channels
    end note
```

## 🎯 Exemplo Prático: Fluxo de Código

```typescript
// 🎛️ AMI detecta nova chamada
this.amiService.on('channelCreated', (event: AmiCallEvent) => {
    console.log('📞 Novo canal AMI:', event);
    this.handleAmiChannelCreated(event); // 🌉 Bridge processa
});

// 🌉 Bridge mapeia usuário
const sipUri = this.extractSipUriFromChannel(event.channel);
const userMapping = findUserMappingBySipUri(sipUri); // 📋 Lookup

// 🌐 ConnectyCube autentica com credenciais exclusivas
const connectyCubeSession = await this.connectyCubeService.createUserSession(
    sipUri, // "sip:vendas@empresa.com"
    sessionId
);

// 🎵 SIP.js processa mídia (futuro)
// const mediaStream = await this.sipClient.processMedia(channel);

// 🎛️ Controle durante chamada
await this.transferCallViaAmi(channel, "2000"); // AMI command
await this.hangupChannelViaAmi(channel);        // AMI command
```

Esta arquitetura híbrida oferece:
- ✅ **Controle total** via AMI (Asterisk)
- ✅ **Mídia otimizada** via SIP.js (futuro)
- ✅ **WebRTC nativo** via ConnectyCube
- ✅ **Flexibilidade** máxima para casos de uso complexos
