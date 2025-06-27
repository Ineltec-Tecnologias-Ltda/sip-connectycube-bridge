import { EventEmitter } from 'node:events';
import { AmiConfig, AmiCallEvent, AsteriskChannelStatus } from '../interfaces/types';
import * as net from 'net';

/**
 * AsteriskAmiService - Integração com Asterisk Manager Interface
 * 
 * Esta classe fornece integração com o Asterisk via AMI para:
 * - Monitoramento de chamadas em tempo real
 * - Controle de canais e bridges
 * - Transferência de chamadas
 * - Integração com dialplan
 * - Dashboard e relatórios avançados
 * 
 * ARQUITETURA HÍBRIDA:
 * - AMI: Controle e monitoramento de chamadas
 * - SIP.js: Processamento de mídia WebRTC
 * - ConnectyCube: WebRTC para aplicações web/mobile
 * 
 * CASOS DE USO:
 * - Call centers com dashboard em tempo real
 * - Transferência inteligente de chamadas
 * - Gravação e monitoramento
 * - Relatórios detalhados de CDR
 * 
 * NOTA: Implementação básica com socket TCP nativo.
 * Para produção, recomenda-se usar biblioteca dedicada como 'asterisk-ami'.
 */
export class AsteriskAmiService extends EventEmitter {
  private config: AmiConfig;
  private socket: net.Socket | null = null;
  private connected: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private keepAliveTimer: NodeJS.Timeout | null = null;
  private activeChannels: Map<string, AsteriskChannelStatus> = new Map();
  private authenticated: boolean = false;
  private buffer: string = '';

  constructor(config: AmiConfig) {
    super();
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log('🔧 Inicializando Asterisk AMI Service...');
    
    try {
      await this.connect();
      
      if (this.config.keepAlive) {
        this.startKeepAlive();
      }

      console.log('✅ Asterisk AMI Service inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar AMI Service:', error);
      throw error;
    }
  }

  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();
      
      this.socket.connect(this.config.port, this.config.host, () => {
        console.log('🔌 Conectado ao socket AMI');
        this.connected = true;
      });

      this.socket.on('data', (data: Buffer) => {
        this.handleData(data.toString());
      });

      this.socket.on('connect', async () => {
        try {
          await this.authenticate();
          console.log('✅ Conectado e autenticado no Asterisk AMI');
          this.emit('connected');
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      this.socket.on('error', (error) => {
        console.error('❌ Erro no socket AMI:', error);
        this.connected = false;
        this.authenticated = false;
        this.emit('error', error);
        
        if (this.config.reconnect) {
          this.scheduleReconnect();
        }
        reject(error);
      });

      this.socket.on('close', () => {
        console.log('❌ Conexão AMI fechada');
        this.connected = false;
        this.authenticated = false;
        this.emit('disconnected');
        
        if (this.config.reconnect) {
          this.scheduleReconnect();
        }
      });
    });
  }

  private async authenticate(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket não conectado'));
        return;
      }

      const loginAction = [
        'Action: Login',
        `Username: ${this.config.username}`,
        `Secret: ${this.config.secret}`,
        `Events: ${this.config.events ? 'on' : 'off'}`,
        '', ''
      ].join('\r\n');

      // Listener temporário para resposta de login
      const handleLoginResponse = (response: string) => {
        if (response.includes('Response: Success')) {
          this.authenticated = true;
          console.log('✅ Autenticado no AMI');
          resolve();
        } else if (response.includes('Response: Error')) {
          reject(new Error('Falha na autenticação AMI'));
        }
      };

      // Configurar listener temporário
      this.once('loginResponse', handleLoginResponse);
      
      this.socket.write(loginAction);
      
      // Timeout para autenticação
      setTimeout(() => {
        this.removeListener('loginResponse', handleLoginResponse);
        reject(new Error('Timeout na autenticação AMI'));
      }, 10000);
    });
  }

  private handleData(data: string): void {
    this.buffer += data;
    
    // Processar mensagens completas (terminam com \r\n\r\n)
    const messages = this.buffer.split('\r\n\r\n');
    this.buffer = messages.pop() || ''; // Manter última mensagem incompleta

    for (const message of messages) {
      if (message.trim()) {
        this.parseAmiMessage(message);
      }
    }
  }

  private parseAmiMessage(message: string): void {
    const lines = message.split('\r\n');
    const parsed: Record<string, string> = {};
    
    for (const line of lines) {
      const [key, ...valueParts] = line.split(': ');
      if (key && valueParts.length > 0) {
        parsed[key.toLowerCase()] = valueParts.join(': ');
      }
    }

    // Detectar tipo de mensagem
    if (parsed.response) {
      this.handleResponse(parsed);
    } else if (parsed.event) {
      this.handleEvent(parsed);
    }
  }

  private handleResponse(response: Record<string, string>): void {
    // Emitir resposta de login para autenticação
    if (response.message && response.message.includes('Authentication')) {
      this.emit('loginResponse', response);
    }
  }

  private handleEvent(event: Record<string, string>): void {
    const eventType = event.event;
    
    switch (eventType) {
      case 'Newchannel':
        this.handleNewChannel(event);
        break;
      case 'Hangup':
        this.handleHangup(event);
        break;
      case 'Newstate':
        this.handleChannelStateChange(event);
        break;
      case 'Bridge':
        this.handleBridgeEvent(event);
        break;
      case 'Dial':
        this.handleDialEvent(event);
        break;
      default:
        console.log(`📡 Evento AMI não tratado: ${eventType}`, event);
    }
  }

  private handleNewChannel(event: Record<string, string>): void {
    const channelStatus: AsteriskChannelStatus = {
      channel: event.channel || '',
      channelState: event.channelstate || '',
      channelStateDesc: event.channelstatedesc || '',
      callerIdNum: event.calleridnum || '',
      callerIdName: event.calleridname || '',
      connectedLineNum: event.connectedlinenum || '',
      connectedLineName: event.connectedlinename || '',
      language: event.language || '',
      accountCode: event.accountcode || '',
      context: event.context || '',
      exten: event.exten || '',
      priority: event.priority || '',
      uniqueId: event.uniqueid || '',
      linkedId: event.linkedid || ''
    };

    this.activeChannels.set(event.uniqueid || '', channelStatus);
    
    const amiEvent: AmiCallEvent = {
      event: 'NewChannel',
      channel: event.channel || '',
      uniqueid: event.uniqueid || '',
      calleridnum: event.calleridnum || '',
      calleridname: event.calleridname || '',
      connectedlinenum: event.connectedlinenum || '',
      connectedlinename: event.connectedlinename || '',
      accountcode: event.accountcode || '',
      context: event.context || '',
      exten: event.exten || '',
      priority: event.priority || '',
      timestamp: new Date()
    };

    this.emit('channelCreated', amiEvent);
  }

  private handleHangup(event: Record<string, string>): void {
    this.activeChannels.delete(event.uniqueid || '');
    
    const amiEvent: AmiCallEvent = {
      event: 'Hangup',
      channel: event.channel || '',
      uniqueid: event.uniqueid || '',
      calleridnum: event.calleridnum || '',
      calleridname: event.calleridname || '',
      connectedlinenum: event.connectedlinenum || '',
      connectedlinename: event.connectedlinename || '',
      accountcode: event.accountcode || '',
      context: event.context || '',
      exten: event.exten || '',
      priority: event.priority || '',
      timestamp: new Date()
    };

    this.emit('channelHangup', amiEvent);
  }

  private handleChannelStateChange(event: Record<string, string>): void {
    const existingChannel = this.activeChannels.get(event.uniqueid || '');
    if (existingChannel) {
      existingChannel.channelState = event.channelstate || '';
      existingChannel.channelStateDesc = event.channelstatedesc || '';
      this.activeChannels.set(event.uniqueid || '', existingChannel);
    }

    const amiEvent: AmiCallEvent = {
      event: 'NewState',
      channel: event.channel || '',
      uniqueid: event.uniqueid || '',
      calleridnum: event.calleridnum || '',
      calleridname: event.calleridname || '',
      connectedlinenum: event.connectedlinenum || '',
      connectedlinename: event.connectedlinename || '',
      accountcode: event.accountcode || '',
      context: event.context || '',
      exten: event.exten || '',
      priority: event.priority || '',
      timestamp: new Date()
    };

    this.emit('channelStateChange', amiEvent);
  }

  private handleBridgeEvent(event: Record<string, string>): void {
    const amiEvent: AmiCallEvent = {
      event: 'Bridge',
      channel: event.channel1 || '',
      uniqueid: event.uniqueid1 || '',
      calleridnum: event.calleridnum1 || '',
      calleridname: event.calleridname1 || '',
      connectedlinenum: event.connectedlinenum1 || '',
      connectedlinename: event.connectedlinename1 || '',
      accountcode: '',
      context: '',
      exten: '',
      priority: '',
      timestamp: new Date(),
      bridgeData: {
        bridgeUniqueId: event.bridgeuniqueid || '',
        bridgeType: event.bridgetype || '',
        bridgeChannels: [event.channel1 || '', event.channel2 || ''].filter(Boolean)
      }
    };

    this.emit('bridgeEvent', amiEvent);
  }

  private handleDialEvent(event: Record<string, string>): void {
    const amiEvent: AmiCallEvent = {
      event: 'Dial',
      channel: event.channel || '',
      uniqueid: event.uniqueid || '',
      calleridnum: event.calleridnum || '',
      calleridname: event.calleridname || '',
      connectedlinenum: event.connectedlinenum || '',
      connectedlinename: event.connectedlinename || '',
      accountcode: event.accountcode || '',
      context: event.context || '',
      exten: event.exten || '',
      priority: event.priority || '',
      timestamp: new Date()
    };

    this.emit('dialEvent', amiEvent);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(async () => {
      console.log('🔄 Tentando reconectar ao AMI...');
      try {
        await this.connect();
      } catch (error) {
        console.error('❌ Falha na reconexão AMI:', error);
      }
    }, 5000);
  }

  private startKeepAlive(): void {
    const delay = this.config.keepAliveDelay || 30000; // 30s default
    
    this.keepAliveTimer = setInterval(() => {
      if (this.connected && this.socket && this.authenticated) {
        this.sendAction('Ping', {});
      }
    }, delay);
  }

  private sendAction(action: string, parameters: Record<string, string>): void {
    if (!this.socket || !this.authenticated) {
      console.error('❌ Não é possível enviar ação: não conectado/autenticado');
      return;
    }

    const lines = [`Action: ${action}`];
    
    for (const [key, value] of Object.entries(parameters)) {
      lines.push(`${key}: ${value}`);
    }
    
    lines.push('', ''); // Linha vazia para terminar a ação
    
    this.socket.write(lines.join('\r\n'));
  }

  // Métodos públicos para controle de chamadas

  async getChannelStatus(channel: string): Promise<AsteriskChannelStatus | null> {
    return new Promise((resolve) => {
      const handler = (event: AmiCallEvent) => {
        if (event.channel === channel) {
          const status = this.activeChannels.get(event.uniqueid);
          resolve(status || null);
        }
      };

      this.once('channelStatusResponse', handler);
      this.sendAction('Status', { Channel: channel });
      
      // Timeout
      setTimeout(() => {
        this.removeListener('channelStatusResponse', handler);
        resolve(null);
      }, 5000);
    });
  }

  async hangupChannel(channel: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.sendAction('Hangup', { Channel: channel });
      resolve(true); // Simplificado - em produção, aguardar resposta
    });
  }

  async transferCall(channel: string, extension: string, context: string = 'default'): Promise<boolean> {
    return new Promise((resolve) => {
      this.sendAction('Redirect', {
        Channel: channel,
        Exten: extension,
        Context: context,
        Priority: '1'
      });
      resolve(true);
    });
  }

  async originateCall(channel: string, extension: string, context: string = 'default'): Promise<boolean> {
    return new Promise((resolve) => {
      this.sendAction('Originate', {
        Channel: channel,
        Exten: extension,
        Context: context,
        Priority: '1',
        Timeout: '30000'
      });
      resolve(true);
    });
  }

  async bridgeChannels(channel1: string, channel2: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.sendAction('Bridge', {
        Channel1: channel1,
        Channel2: channel2
      });
      resolve(true);
    });
  }

  getActiveChannels(): Map<string, AsteriskChannelStatus> {
    return new Map(this.activeChannels);
  }

  isConnected(): boolean {
    return this.connected && this.authenticated;
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }

    if (this.socket && this.connected) {
      this.sendAction('Logoff', {});
      this.socket.end();
      this.connected = false;
      this.authenticated = false;
      console.log('✅ AMI desconectado');
    }
  }
}
