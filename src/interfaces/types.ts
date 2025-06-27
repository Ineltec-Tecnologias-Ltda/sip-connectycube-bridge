// Interfaces específicas para SIP Direct Bridge
export interface SipCallEvent {
  type: 'incoming_call' | 'call_ended' | 'call_answered';
  sipCallId: string;
  fromUri: string;
  toUri: string;
  timestamp: Date;
  hasVideo: boolean;
  connectyCubeUser?: {
    username: string;
    password: string;
    userId?: number;
  };
  videoConfig?: {
    enableVideo: boolean;
    videoFromSipPhone: boolean;
    audioBidirectional: boolean;
  };
  metadata?: any;
}

// Configuração do Asterisk Manager Interface (AMI)
export interface AmiConfig {
  host: string;
  port: number;
  username: string;
  secret: string;
  events: boolean;
  reconnect: boolean;
  keepAlive: boolean;
  keepAliveDelay?: number;
}

// Configuração híbrida: SIP.js para mídia + AMI para controle
export interface HybridBridgeConfig {
  mode: 'sip-only' | 'ami-only' | 'hybrid';
  ami?: AmiConfig;
  sip: SipConfig;
  connectyCube: ConnectyCubeConfig;
  mediaHandling: {
    sipJsForMedia: boolean;
    amiForControl: boolean;
    asteriskContext: string;
    dialplanIntegration: boolean;
  };
}

// Eventos AMI específicos para integração
export interface AmiCallEvent {
  event: string;
  channel: string;
  uniqueid: string;
  calleridnum: string;
  calleridname: string;
  connectedlinenum: string;
  connectedlinename: string;
  accountcode: string;
  context: string;
  exten: string;
  priority: string;
  timestamp: Date;
  bridgeData?: {
    bridgeUniqueId: string;
    bridgeType: string;
    bridgeChannels: string[];
  };
}

// Status de canal do Asterisk
export interface AsteriskChannelStatus {
  channel: string;
  channelState: string;
  channelStateDesc: string;
  callerIdNum: string;
  callerIdName: string;
  connectedLineNum: string;
  connectedLineName: string;
  language: string;
  accountCode: string;
  context: string;
  exten: string;
  priority: string;
  uniqueId: string;
  linkedId: string;
}

// Configuração SIP
export interface SipConfig {
  domain: string;
  port: number;
  transport: 'UDP' | 'TCP' | 'TLS';
  username: string;
  password: string;
  registrar: string;
  registerInterval: number;
  audioCodecs: string[];
  videoCodecs?: string[];
  rtpPortRange: {
    min: number;
    max: number;
  };
  dtmfMode?: 'RFC2833' | 'INFO' | 'INBAND';
}

// Configuração ConnectyCube
export interface ConnectyCubeConfig {
  appId: string;
  authKey: string;
  authSecret: string;
  accountKey: string;
  apiEndpoint?: string;
  chatEndpoint?: string;
  videoConfig?: {
    defaultVideoEnabled: boolean;
    videoFromSipPhoneOnly: boolean;
    audioBidirectional: boolean;
  };
}

// Configuração do SIP Direct Bridge
export interface SipDirectBridgeConfig {
  port: number;
  mode?: 'sip-only' | 'ami-only' | 'hybrid'; // Novo: modo de operação
  sip: SipConfig;
  connectyCube: ConnectyCubeConfig;
  ami?: AmiConfig; // Novo: configuração AMI opcional
  // ⚠️ DEPRECATED: userMapping - agora usamos sistema de mapeamento exclusivo
  // Mantido para compatibilidade, mas use src/config/sip-user-mappings.ts
  userMapping?: Record<string, number>; // SIP URI → ConnectyCube User ID (legacy)
}

// Session para chamadas SIP diretas
export interface SipCallSession {
  sessionId: string;
  sipCallId: string;
  fromUri: string;
  toUri: string;
  connectyCubeUserId: number;
  connectyCubeSessionId?: string;
  status: 'ringing' | 'connecting' | 'connected' | 'ended';
  startTime: Date;
  endTime?: Date;
  hasVideo: boolean;
  audioCodec?: string;
  videoCodec?: string;
  rtpStats?: {
    packetsReceived: number;
    packetsSent: number;
    bytesReceived: number;
    bytesSent: number;
    jitter: number;
    packetLoss: number;
  };
}

export interface SipRegistrationStatus {
  sipUri: string;
  registered: boolean;
  registrationTime?: Date;
  expires?: Date;
  registrar: string;
}

export interface MediaStreamInfo {
  sessionId: string;
  streamType: 'audio' | 'video' | 'both';
  direction: 'incoming' | 'outgoing' | 'bidirectional';
  codec: string;
  bitrate?: number;
  resolution?: {
    width: number;
    height: number;
  };
}
