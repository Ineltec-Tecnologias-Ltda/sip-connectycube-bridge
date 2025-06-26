import ConnectyCube from 'connectycube';
import { EventEmitter } from 'node:events';
import { ConnectyCubeConfig } from '../interfaces/types';

interface UserSession {
  sessionId: string;
  user: any;
  webRTCSession: any;
  username: string;
  isLoggedIn: boolean;
}

/**
 * ConnectyCube Service para SIP Direct Bridge
 * 
 * Gerencia sessões ConnectyCube para chamadas originárias de fones SIP
 */
export class ConnectyCubeService extends EventEmitter {
  private initialized = false;
  private userSessions = new Map<string, UserSession>();
  private defaultUser: any = null;

  constructor(private config: ConnectyCubeConfig) {
    super();
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const credentials: any = {
      appId: this.config.appId,
      authKey: this.config.authKey,
      authSecret: this.config.authSecret,
      accountKey: this.config.accountKey
    };

    if (this.config.apiEndpoint) {
      credentials.config = {
        endpoints: {
          api: this.config.apiEndpoint
        }
      };
    }

    if (this.config.chatEndpoint) {
      credentials.config = {
        ...credentials.config,
        endpoints: {
          ...credentials.config?.endpoints,
          chat: this.config.chatEndpoint
        }
      };
    }

    try {
      await ConnectyCube.init(credentials);
      this.initialized = true;
      console.log('✅ ConnectyCube initialized successfully for SIP Bridge');
    } catch (error) {
      console.error('❌ Failed to initialize ConnectyCube:', error);
      throw error;
    }
  }

  async createUserSession(username: string, password: string, userId?: string): Promise<UserSession> {
    if (!this.initialized) {
      await this.initialize();
    }

    const sessionId = userId || `sip-${Date.now()}`;

    try {
      console.log(`📋 Creating ConnectyCube session for SIP user: ${username} (sessionId: ${sessionId})`);
      
      const user = await ConnectyCube.createSession({ login: username, password });
      
      // Connect to chat
      await ConnectyCube.chat.connect({
        userId: user.id,
        password: password
      });

      const userSession: UserSession = {
        sessionId,
        user,
        webRTCSession: null,
        username,
        isLoggedIn: true
      };

      this.userSessions.set(sessionId, userSession);
      console.log(`✅ SIP user ${username} logged in ConnectyCube (session ${sessionId})`);
      
      return userSession;
    } catch (error) {
      console.error(`❌ Failed to create ConnectyCube session for SIP user ${username}:`, error);
      throw error;
    }
  }

  async initiateCallForSession(
    sessionId: string, 
    targetUserId: number, 
    videoConfig?: { enableVideo: boolean, videoFromSipPhone: boolean, audioBidirectional: boolean }
  ): Promise<any> {
    const userSession = this.userSessions.get(sessionId);
    if (!userSession || !userSession.isLoggedIn) {
      throw new Error(`No logged in ConnectyCube user found for SIP session ${sessionId}`);
    }

    try {
      const calleesIds = [targetUserId];
      
      // Configurar tipo de chamada: VIDEO para chamadas com vídeo do SIP
      const sessionType = videoConfig?.enableVideo 
        ? (ConnectyCube as any).videochat.CallType.VIDEO 
        : (ConnectyCube as any).videochat.CallType.AUDIO;
      
      const webRTCSession = (ConnectyCube as any).videochat.createNewSession(calleesIds, sessionType);
      userSession.webRTCSession = webRTCSession;
      
      // Set up session event handlers
      this.setupSessionHandlers(sessionId, webRTCSession);
      
      // Configure media constraints para SIP bridge
      let mediaConstraints: any = { audio: true };
      if (videoConfig?.enableVideo && videoConfig?.videoFromSipPhone) {
        // Vídeo do telefone SIP para ConnectyCube
        mediaConstraints.video = true;
      }
      
      // Initiate the call with media constraints
      await webRTCSession.call(mediaConstraints);
      
      console.log(`📹 ${videoConfig?.enableVideo ? 'Video' : 'Audio'} call initiated from SIP to ConnectyCube user ${targetUserId} (session ${sessionId})`);
      if (videoConfig?.enableVideo) {
        console.log(`📹 Video config: fromSipPhone=${videoConfig.videoFromSipPhone}, audioBidirectional=${videoConfig.audioBidirectional}`);
      }
      return webRTCSession;
      
    } catch (error) {
      console.error(`❌ Failed to initiate ConnectyCube call from SIP session ${sessionId}:`, error);
      throw error;
    }
  }

  private setupSessionHandlers(sessionId: string, webRTCSession: any): void {
    if (!webRTCSession) return;

    webRTCSession.on('onRemoteStreamReceived', (session: any, userId: string, stream: MediaStream) => {
      console.log(`🎵 Remote stream received from ConnectyCube user: ${userId} for SIP session ${sessionId}`);
      
      // Identificar se é stream de áudio ou vídeo
      const hasVideo = stream.getVideoTracks().length > 0;
      const hasAudio = stream.getAudioTracks().length > 0;
      
      console.log(`📊 Stream type: ${hasVideo ? 'Video+Audio' : 'Audio only'} (video tracks: ${stream.getVideoTracks().length}, audio tracks: ${stream.getAudioTracks().length})`);
      
      this.emit('remoteStreamReceived', { sessionId, session, userId, stream, hasVideo, hasAudio });
      
      // Emit evento específico para streams de vídeo vindos do ConnectyCube
      if (hasVideo) {
        console.log(`📹 Video stream received from ConnectyCube user: ${userId} (for SIP bridge)`);
        this.emit('videoStreamReceived', { sessionId, userId, stream, hasVideo, hasAudio });
      }
    });

    webRTCSession.on('onSessionConnectionStateChanged', (session: any, userId: string, connectionState: any) => {
      console.log(`🔗 Connection state changed for SIP session ${sessionId}:`, connectionState);
      this.emit('connectionStateChanged', { sessionId, session, userId, connectionState });
    });

    webRTCSession.on('onCallAcceptedByUser', (session: any, userId: string) => {
      console.log(`✅ Call accepted by ConnectyCube user: ${userId} for SIP session ${sessionId}`);
      this.emit('callAccepted', { sessionId, session, userId });
    });

    webRTCSession.on('onCallRejectedByUser', (session: any, userId: string, rejectionInfo: any) => {
      console.log(`❌ Call rejected by ConnectyCube user: ${userId} for SIP session ${sessionId}`);
      this.emit('callRejected', { sessionId, session, userId, rejectionInfo });
    });

    webRTCSession.on('onUserNotAnswered', (session: any, userId: string) => {
      console.log(`⏰ ConnectyCube user ${userId} did not answer SIP call (session ${sessionId})`);
      this.emit('userNotAnswered', { sessionId, session, userId });
    });

    webRTCSession.on('onSessionClosed', (session: any) => {
      console.log(`🔚 ConnectyCube session closed for SIP session ${sessionId}`);
      this.emit('sessionClosed', { sessionId, session });
    });

    webRTCSession.on('onUserHungUp', (session: any, userId: string) => {
      console.log(`📴 ConnectyCube user ${userId} hung up SIP call (session ${sessionId})`);
      this.emit('userHungUp', { sessionId, session, userId });
    });
  }

  async endCallForSession(sessionId: string): Promise<void> {
    const userSession = this.userSessions.get(sessionId);
    if (!userSession?.webRTCSession) {
      console.log(`⚠️  No active ConnectyCube call found for SIP session ${sessionId}`);
      return;
    }

    try {
      await userSession.webRTCSession.stop();
      userSession.webRTCSession = null;
      console.log(`✅ ConnectyCube call ended for SIP session ${sessionId}`);
    } catch (error) {
      console.error(`❌ Error ending ConnectyCube call for SIP session ${sessionId}:`, error);
    }
  }

  async logoutSession(sessionId: string): Promise<void> {
    const userSession = this.userSessions.get(sessionId);
    if (!userSession) {
      console.log(`⚠️  No ConnectyCube session found for SIP session ${sessionId}`);
      return;
    }

    try {
      // End any active call first
      if (userSession.webRTCSession) {
        await this.endCallForSession(sessionId);
      }

      // Disconnect from chat
      await ConnectyCube.chat.disconnect();
      
      // Destroy session
      await ConnectyCube.destroySession();
      
      userSession.isLoggedIn = false;
      this.userSessions.delete(sessionId);
      
      console.log(`✅ ConnectyCube session logged out for SIP session ${sessionId}`);
    } catch (error) {
      console.error(`❌ Error logging out ConnectyCube session ${sessionId}:`, error);
    }
  }

  getUserSessions(): Map<string, UserSession> {
    return this.userSessions;
  }

  getSessionInfo(sessionId: string): UserSession | undefined {
    return this.userSessions.get(sessionId);
  }

  async shutdown(): Promise<void> {
    console.log('🔌 Shutting down ConnectyCube Service...');
    
    // Logout all sessions
    const sessionIds = Array.from(this.userSessions.keys());
    for (const sessionId of sessionIds) {
      await this.logoutSession(sessionId);
    }
    
    this.userSessions.clear();
    this.initialized = false;
    
    console.log('✅ ConnectyCube Service shutdown complete');
  }
}
