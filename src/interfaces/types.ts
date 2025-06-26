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

export interface SipDirectBridgeConfig {
  port: number;
  sip: SipConfig;
  connectyCube: ConnectyCubeConfig;
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
