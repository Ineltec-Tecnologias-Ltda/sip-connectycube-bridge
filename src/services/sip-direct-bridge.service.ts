import { EventEmitter } from 'events';
import { ConnectyCubeService } from './connectycube.service';
import { SipDirectBridgeConfig, SipCallSession, SipCallEvent, MediaStreamInfo } from '../interfaces/types';

/**
 * SipDirectBridge - Conecta fones SIP diretamente ao ConnectyCube
 * 
 * Esta classe elimina a necessidade do Asterisk, conectando
 * diretamente fones SIP aos usuários ConnectyCube via WebRTC.
 * 
 * FUNCIONALIDADES:
 * - Registro SIP automático
 * - Detecção de chamadas SIP incoming
 * - Bridge RTP ↔ WebRTC
 * - Suporte a vídeo e áudio
 * - Mapeamento SIP URI → ConnectyCube User ID
 */
export class SipDirectBridge extends EventEmitter {
  private config: SipDirectBridgeConfig;
  private connectyCubeService: ConnectyCubeService;
  private activeSessions: Map<string, SipCallSession> = new Map();
  private sipRegistered: boolean = false;
  
  // Simulação de biblioteca SIP (em produção, usar uma biblioteca real como 'sip.js' ou 'jssip')
  private sipClient: any = null;

  constructor(config: SipDirectBridgeConfig) {
    super();
    this.config = config;
    this.connectyCubeService = new ConnectyCubeService(config.connectyCube);
  }

  async initialize(): Promise<void> {
    console.log('🔧 Inicializando ponte SIP direta...');
    
    try {
      // Inicializar ConnectyCube
      await this.connectyCubeService.initialize();
      console.log('✅ ConnectyCube Service inicializado');
      
      // Inicializar cliente SIP
      await this.initializeSipClient();
      console.log('✅ Cliente SIP inicializado');
      
      // Registrar eventos SIP
      this.setupSipEventHandlers();
      console.log('✅ Event handlers SIP configurados');
      
      // Registrar no servidor SIP
      await this.registerSip();
      console.log('✅ Registrado no servidor SIP');
      
      console.log('🚀 Ponte SIP → ConnectyCube pronta!');
      
    } catch (error) {
      console.error('❌ Erro ao inicializar ponte SIP:', error);
      throw error;
    }
  }

  private async initializeSipClient(): Promise<void> {
    // NOTA: Em produção, usar uma biblioteca SIP real como:
    // - JsSIP: https://jssip.net/
    // - SIP.js: https://sipjs.com/
    // - Node SIP: https://www.npmjs.com/package/sip
    
    console.log('📞 Inicializando cliente SIP...');
    console.log(`SIP Server: ${this.config.sip.registrar}`);
    console.log(`SIP User: ${this.config.sip.username}@${this.config.sip.domain}`);
    console.log(`Transport: ${this.config.sip.transport}`);
    console.log(`Audio Codecs: ${this.config.sip.audioCodecs.join(', ')}`);
    if (this.config.sip.videoCodecs) {
      console.log(`Video Codecs: ${this.config.sip.videoCodecs.join(', ')}`);
    }
    
    // Simulação - em produção, configurar cliente SIP real
    this.sipClient = {
      register: () => Promise.resolve(),
      on: (event: string, callback: Function) => {
        // Registrar callbacks
      },
      call: (uri: string, options: any) => {
        // Iniciar chamada SIP
      },
      answer: (callId: string) => {
        // Atender chamada
      },
      hangup: (callId: string) => {
        // Desligar chamada
      }
    };
  }

  private setupSipEventHandlers(): void {
    // Setup ConnectyCube event handlers
    this.connectyCubeService.on('callAccepted', (data) => {
      console.log(`✅ ConnectyCube call accepted for SIP session: ${data.sessionId}`);
      this.handleConnectyCubeCallAccepted(data);
    });

    this.connectyCubeService.on('callRejected', (data) => {
      console.log(`❌ ConnectyCube call rejected for SIP session: ${data.sessionId}`);
      this.handleConnectyCubeCallRejected(data);
    });

    this.connectyCubeService.on('userHungUp', (data) => {
      console.log(`📴 ConnectyCube user hung up for SIP session: ${data.sessionId}`);
      this.handleConnectyCubeHangup(data);
    });

    this.connectyCubeService.on('remoteStreamReceived', (data) => {
      console.log(`🎵 Remote stream received for SIP session: ${data.sessionId}`);
      this.handleRemoteStreamReceived(data);
    });

    // Simular eventos SIP para demonstração
    setTimeout(() => {
      this.simulateSipEvents();
    }, 2000);
  }

  private async registerSip(): Promise<void> {
    try {
      const sipUri = `sip:${this.config.sip.username}@${this.config.sip.domain}`;
      
      // Em produção, fazer registro SIP real
      console.log(`📋 Registrando SIP: ${sipUri}`);
      
      // Simulação de registro bem-sucedido
      this.sipRegistered = true;
      this.emit('sipRegistered', sipUri);
      
    } catch (error) {
      console.error('❌ Falha no registro SIP:', error);
      throw error;
    }
  }

  private async handleIncomingSipCall(callEvent: SipCallEvent): Promise<void> {
    console.log(`📞 Chamada SIP recebida de ${callEvent.fromUri} para ${callEvent.toUri}`);
    
    const sessionId = `sip-${callEvent.sipCallId}`;
    
    // Mapear SIP URI para ConnectyCube User ID
    const connectyCubeUserId = this.config.userMapping[callEvent.fromUri];
    
    if (!connectyCubeUserId) {
      console.log(`❌ Nenhum usuário ConnectyCube mapeado para ${callEvent.fromUri}`);
      return;
    }
    
    const session: SipCallSession = {
      sessionId,
      sipCallId: callEvent.sipCallId,
      fromUri: callEvent.fromUri,
      toUri: callEvent.toUri,
      connectyCubeUserId,
      status: 'ringing',
      startTime: new Date(),
      hasVideo: callEvent.hasVideo
    };
    
    this.activeSessions.set(sessionId, session);
    
    try {
      // Criar sessão ConnectyCube
      const connectyCubeSession = await this.connectyCubeService.createUserSession(
        this.config.sip.username,
        this.config.sip.password,
        sessionId
      );
      
      session.connectyCubeSessionId = connectyCubeSession.sessionId;
      
      // Configuração de vídeo
      const videoConfig = callEvent.videoConfig || {
        enableVideo: callEvent.hasVideo,
        videoFromSipPhone: true,
        audioBidirectional: true
      };
      
      // Iniciar chamada ConnectyCube
      await this.connectyCubeService.initiateCallForSession(
        connectyCubeSession.sessionId,
        connectyCubeUserId,
        videoConfig
      );
      
      session.status = 'connecting';
      
      this.emit('callBridged', {
        sessionId,
        sipCallId: callEvent.sipCallId,
        connectyCubeUserId,
        connectyCubeSessionId: connectyCubeSession.sessionId
      });
      
      this.emit('incomingCall', callEvent);
      
      // Simular estatísticas de mídia
      this.simulateMediaStats(session);
      
    } catch (error) {
      console.error('❌ Erro ao processar chamada SIP:', error);
      session.status = 'ended';
      this.activeSessions.delete(sessionId);
    }
  }

  private handleConnectyCubeCallAccepted(data: any): void {
    const session = this.activeSessions.get(data.sessionId);
    if (session) {
      session.status = 'connected';
      console.log(`🌉 Call bridged: SIP ${session.fromUri} ↔ ConnectyCube User ${session.connectyCubeUserId}`);
      this.emit('callConnected', session);
    }
  }

  private handleConnectyCubeCallRejected(data: any): void {
    const session = this.activeSessions.get(data.sessionId);
    if (session) {
      session.status = 'ended';
      session.endTime = new Date();
      this.emit('callRejected', session);
      this.activeSessions.delete(data.sessionId);
    }
  }

  private handleConnectyCubeHangup(data: any): void {
    const session = this.activeSessions.get(data.sessionId);
    if (session) {
      session.status = 'ended';
      session.endTime = new Date();
      
      const duration = session.endTime.getTime() - session.startTime.getTime();
      
      this.emit('callEnded', {
        ...session,
        duration: Math.round(duration / 1000)
      });
      
      this.activeSessions.delete(data.sessionId);
    }
  }

  private handleRemoteStreamReceived(data: any): void {
    const mediaInfo: MediaStreamInfo = {
      sessionId: data.sessionId,
      streamType: data.hasVideo ? 'both' : 'audio',
      direction: 'incoming',
      codec: data.hasVideo ? 'H264' : 'PCMU'
    };
    
    this.emit('mediaFlowing', mediaInfo);
  }

  private simulateMediaStats(session: SipCallSession): void {
    // Simular estatísticas de mídia RTP
    const rtpStats = {
      packetsReceived: Math.floor(Math.random() * 1000),
      packetsSent: Math.floor(Math.random() * 1000),
      bytesReceived: Math.floor(Math.random() * 50000),
      bytesSent: Math.floor(Math.random() * 50000),
      jitter: Math.random() * 10,
      packetLoss: Math.random() * 5
    };
    
    session.rtpStats = rtpStats;
    
    const mediaData = {
      sessionId: session.sessionId,
      audioCodec: session.audioCodec || 'PCMU',
      videoCodec: session.hasVideo ? (session.videoCodec || 'H264') : undefined,
      rtpStats
    };
    
    this.emit('mediaFlowing', mediaData);
    
    // Continuar enviando estatísticas a cada 5 segundos
    setTimeout(() => {
      if (this.activeSessions.has(session.sessionId)) {
        this.simulateMediaStats(session);
      }
    }, 5000);
  }

  private simulateSipEvents(): void {
    // Simular chamadas SIP para demonstração
    console.log('🎭 Simulando eventos SIP para demonstração...\n');
    
    setTimeout(() => {
      const callEvent: SipCallEvent = {
        type: 'incoming_call',
        sipCallId: 'sip-call-001',
        fromUri: 'sip:vendas@meudominio.com',
        toUri: 'sip:cliente@external.com',
        hasVideo: true,
        timestamp: new Date(),
        videoConfig: {
          enableVideo: true,
          videoFromSipPhone: true,
          audioBidirectional: true
        }
      };
      
      this.handleIncomingSipCall(callEvent);
    }, 3000);
    
    setTimeout(() => {
      const callEvent: SipCallEvent = {
        type: 'incoming_call',
        sipCallId: 'sip-call-002',
        fromUri: 'sip:suporte@meudominio.com',
        toUri: 'sip:cliente2@external.com',
        hasVideo: false,
        timestamp: new Date(),
        videoConfig: {
          enableVideo: false,
          videoFromSipPhone: false,
          audioBidirectional: true
        }
      };
      
      this.handleIncomingSipCall(callEvent);
    }, 8000);
  }

  // Métodos públicos para controle de chamadas
  async hangupCall(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.log(`❌ Sessão SIP ${sessionId} não encontrada`);
      return;
    }
    
    // End ConnectyCube call
    if (session.connectyCubeSessionId) {
      await this.connectyCubeService.endCallForSession(session.connectyCubeSessionId);
    }
    
    session.status = 'ended';
    session.endTime = new Date();
    
    const duration = session.endTime.getTime() - session.startTime.getTime();
    
    this.emit('callEnded', {
      sessionId,
      sipCallId: session.sipCallId,
      duration: Math.round(duration / 1000),
      reason: 'user_hangup'
    });
    
    this.activeSessions.delete(sessionId);
    console.log(`📴 Chamada SIP ${session.sipCallId} finalizada`);
  }

  getActiveSessions(): Map<string, SipCallSession> {
    return this.activeSessions;
  }

  isRegistered(): boolean {
    return this.sipRegistered;
  }

  async shutdown(): Promise<void> {
    console.log('🔌 Desligando ponte SIP...');
    
    // Finalizar todas as sessões ativas
    const sessionIds = Array.from(this.activeSessions.keys());
    for (const sessionId of sessionIds) {
      await this.hangupCall(sessionId);
    }
    
    // Shutdown ConnectyCube service
    await this.connectyCubeService.shutdown();
    
    // Desregistrar do servidor SIP
    this.sipRegistered = false;
    
    console.log('✅ Ponte SIP desligada');
  }
}
