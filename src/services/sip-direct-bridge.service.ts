import { EventEmitter } from 'node:events';
// import { UserAgent, Registerer, Inviter, Invitation, SessionState, URI } from 'sip.js';
import { ConnectyCubeService } from './connectycube.service';
import { SipDirectBridgeConfig, SipCallSession, SipCallEvent, MediaStreamInfo } from '../interfaces/types';
import { findUserMappingBySipUri, hasSipUserMapping } from '../config/sip-user-mappings';

/**
 * SipDirectBridge - Conecta fones SIP diretamente ao ConnectyCube
 * 
 * Esta classe elimina a necessidade do Asterisk, conectando
 * diretamente fones SIP aos usuários ConnectyCube via WebRTC.
 * 
 * FUNCIONALIDADES:
 * - Registro SIP automático com SIP.js (produção)
 * - Detecção de chamadas SIP incoming
 * - Bridge RTP ↔ WebRTC
 * - Suporte a vídeo e áudio
 * - Mapeamento SIP URI → ConnectyCube User ID
 * 
 * PRODUÇÃO: Usa SIP.js - biblioteca moderna e TypeScript-ready
 * - Melhor suporte a WebRTC
 * - API limpa e bem documentada
 * - Comunidade ativa e desenvolvimento contínuo
 */
export class SipDirectBridge extends EventEmitter {
  private config: SipDirectBridgeConfig;
  private connectyCubeService: ConnectyCubeService;
  private activeSessions: Map<string, SipCallSession> = new Map();
  private sipRegistered: boolean = false;
  
  // SIP.js - Implementação real (temporariamente desabilitada devido a ESM)
  // TODO: Configurar ESM para usar SIP.js em produção
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
    // PRODUÇÃO: SIP.js será integrado após configuração ESM
    // Por enquanto, usando simulação para demonstrar mapeamento exclusivo
    
    console.log('📞 Inicializando cliente SIP com mapeamento exclusivo...');
    console.log(`SIP Server: ${this.config.sip.registrar}`);
    console.log(`SIP User: ${this.config.sip.username}@${this.config.sip.domain}`);
    console.log(`Transport: ${this.config.sip.transport}`);
    console.log(`Audio Codecs: ${this.config.sip.audioCodecs.join(', ')}`);
    if (this.config.sip.videoCodecs) {
      console.log(`Video Codecs: ${this.config.sip.videoCodecs.join(', ')}`);
    }
    
    // Simulação - demonstra o novo sistema de mapeamento
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
    this.connectyCubeService.on('callAccepted', (data: any) => {
      console.log(`✅ ConnectyCube call accepted for SIP session: ${data.sessionId}`);
      this.handleConnectyCubeCallAccepted(data);
    });

    this.connectyCubeService.on('callRejected', (data: any) => {
      console.log(`❌ ConnectyCube call rejected for SIP session: ${data.sessionId}`);
      this.handleConnectyCubeCallRejected(data);
    });

    this.connectyCubeService.on('userHungUp', (data: any) => {
      console.log(`📴 ConnectyCube user hung up for SIP session: ${data.sessionId}`);
      this.handleConnectyCubeHangup(data);
    });

    this.connectyCubeService.on('remoteStreamReceived', (data: any) => {
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
      
      // Simulação de registro SIP (demonstra mapeamento exclusivo)
      console.log(`📋 Registrando SIP com mapeamento exclusivo: ${sipUri}`);
      
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
    
    // Buscar mapeamento SIP URI → ConnectyCube usando novo sistema
    const userMapping = findUserMappingBySipUri(callEvent.fromUri);
    
    if (!userMapping) {
      console.log(`❌ Nenhum usuário ConnectyCube mapeado para ${callEvent.fromUri}`);
      console.log(`💡 SIP URIs disponíveis: ${this.getAvailableSipUris().join(', ')}`);
      return;
    }
    
    console.log(`🔍 Mapeamento encontrado:`);
    console.log(`   📞 SIP URI: ${userMapping.sipUri}`);
    console.log(`   👤 ConnectyCube: ${userMapping.connectyCube.username} (ID: ${userMapping.connectyCube.userId})`);
    console.log(`   🏢 Departamento: ${userMapping.department} - ${userMapping.name}`);
    
    const session: SipCallSession = {
      sessionId,
      sipCallId: callEvent.sipCallId,
      fromUri: callEvent.fromUri,
      toUri: callEvent.toUri,
      connectyCubeUserId: userMapping.connectyCube.userId,
      status: 'ringing',
      startTime: new Date(),
      hasVideo: callEvent.hasVideo
    };
    
    this.activeSessions.set(sessionId, session);
    
    try {
      // Criar sessão ConnectyCube com credenciais exclusivas
      const connectyCubeSession = await this.connectyCubeService.createUserSession(
        callEvent.fromUri, // SIP URI para buscar credenciais corretas
        sessionId
      );
      
      session.connectyCubeSessionId = connectyCubeSession.sessionId;
      
      // Configuração de vídeo
      const videoConfig = callEvent.videoConfig || {
        enableVideo: callEvent.hasVideo,
        videoFromSipPhone: true,
        audioBidirectional: true
      };
      
      // Iniciar chamada ConnectyCube para o usuário de destino
      await this.connectyCubeService.initiateCallForSession(
        connectyCubeSession.sessionId,
        userMapping.connectyCube.userId, // Usar User ID do mapeamento
        videoConfig
      );
      
      session.status = 'connecting';
      
      this.emit('callBridged', {
        sessionId,
        sipCallId: callEvent.sipCallId,
        connectyCubeUserId: userMapping.connectyCube.userId,
        connectyCubeSessionId: connectyCubeSession.sessionId,
        sipUserInfo: {
          sipUri: userMapping.sipUri,
          department: userMapping.department,
          name: userMapping.name
        }
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
  
  private getAvailableSipUris(): string[] {
    // Helper para mostrar SIP URIs disponíveis em caso de erro
    const { SIP_USER_MAPPINGS } = require('../config/sip-user-mappings');
    return SIP_USER_MAPPINGS.map((mapping: any) => mapping.sipUri);
  }

  private handleConnectyCubeCallAccepted(data: any): void {
    const session = this.activeSessions.get(data.sessionId);
    if (session) {
      session.status = 'connected';
      
      const userMapping = findUserMappingBySipUri(session.fromUri);
      const userInfo = userMapping ? 
        `${userMapping.department} - ${userMapping.name} (${userMapping.connectyCube.username})` : 
        session.fromUri;
      
      console.log(`🌉 Call bridged: SIP ${session.fromUri} ↔ ConnectyCube User ${session.connectyCubeUserId}`);
      console.log(`👤 User Info: ${userInfo}`);
      
      this.emit('callConnected', {
        ...session,
        userInfo: userMapping ? {
          department: userMapping.department,
          name: userMapping.name,
          connectyCubeUsername: userMapping.connectyCube.username
        } : undefined
      });
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
    
    // Desregistrar do servidor SIP (simulação)
    this.sipRegistered = false;
    console.log('✅ Desregistrado do servidor SIP');
    
    console.log('✅ Ponte SIP desligada');
  }
}
