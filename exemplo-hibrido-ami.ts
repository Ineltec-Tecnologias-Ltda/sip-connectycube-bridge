import 'dotenv/config';
import { SipDirectBridge } from './src/services/sip-direct-bridge.service';
import { SipDirectBridgeConfig } from './src/interfaces/types';

/**
 * Exemplo de Bridge Híbrido: SIP.js + Asterisk AMI + ConnectyCube
 * 
 * Este exemplo demonstra a arquitetura híbrida onde:
 * - SIP.js processa mídia (RTP ↔ WebRTC)
 * - AMI controla e monitora chamadas do Asterisk
 * - ConnectyCube fornece WebRTC para aplicações
 * 
 * CASOS DE USO ESPECÍFICOS:
 * - Call center com dashboard em tempo real
 * - Transferência inteligente de chamadas  
 * - Monitoramento e gravação avançados
 * - Integração com sistemas CRM/ERP
 * 
 * VANTAGENS DA ARQUITETURA HÍBRIDA:
 * - Melhor performance de mídia (SIP.js otimizado para WebRTC)
 * - Controle avançado via AMI (transfer, conference, monitoring)
 * - Flexibilidade máxima para implementar recursos complexos
 * - Aproveitamento do investimento existente em Asterisk
 */

async function exemploHibrido() {
  console.log('🚀 Iniciando exemplo de Bridge Híbrido (SIP.js + AMI + ConnectyCube)');

  // Configuração híbrida
  const config: SipDirectBridgeConfig = {
    port: 3000,
    mode: 'hybrid', // Modo híbrido: SIP.js + AMI
    
    // Configuração SIP para mídia
    sip: {
      domain: process.env.SIP_DOMAIN || 'localhost',
      port: parseInt(process.env.SIP_PORT || '5060'),
      transport: 'UDP' as const,
      username: process.env.SIP_USERNAME || 'bridge_user',
      password: process.env.SIP_PASSWORD || 'bridge_password',
      registrar: process.env.SIP_REGISTRAR || 'sip:localhost:5060',
      registerInterval: 300,
      audioCodecs: ['PCMU', 'PCMA', 'G722', 'Opus'],
      videoCodecs: ['H264', 'VP8', 'VP9'],
      rtpPortRange: {
        min: 10000,
        max: 20000
      },
      dtmfMode: 'RFC2833'
    },

    // Configuração AMI para controle
    ami: {
      host: process.env.AMI_HOST || 'localhost',
      port: parseInt(process.env.AMI_PORT || '5038'),
      username: process.env.AMI_USERNAME || 'bridge_ami',
      secret: process.env.AMI_SECRET || 'bridge_secret',
      events: true,
      reconnect: true,
      keepAlive: true,
      keepAliveDelay: 30000
    },

    // Configuração ConnectyCube
    connectyCube: {
      appId: process.env.CONNECTYCUBE_APP_ID || '12345',
      authKey: process.env.CONNECTYCUBE_AUTH_KEY || 'auth_key',
      authSecret: process.env.CONNECTYCUBE_AUTH_SECRET || 'auth_secret',
      accountKey: process.env.CONNECTYCUBE_ACCOUNT_KEY || 'account_key',
      videoConfig: {
        defaultVideoEnabled: true,
        videoFromSipPhoneOnly: false,
        audioBidirectional: true
      }
    }
  };

  // Criar bridge híbrido
  const bridge = new SipDirectBridge(config);

  // Event handlers para AMI
  bridge.on('amiConnected', () => {
    console.log('✅ AMI conectado - recursos avançados disponíveis');
  });

  bridge.on('amiDisconnected', () => {
    console.log('❌ AMI desconectado - usando apenas SIP.js');
  });

  // Event handlers para chamadas
  bridge.on('sipCall', async (event) => {
    console.log(`📞 Evento de chamada (${event.type}):`, {
      from: event.fromUri,
      to: event.toUri,
      hasVideo: event.hasVideo,
      connectyCubeUser: event.connectyCubeUser?.username
    });

    if (event.type === 'incoming_call') {
      console.log('🔔 Chamada SIP entrante detectada via AMI');
      console.log('🎵 Mídia será processada via SIP.js');
      console.log('🎛️ Controle será feito via AMI');
    }
  });

  bridge.on('callConnected', (session) => {
    console.log('✅ Chamada conectada:', {
      sessionId: session.sessionId,
      from: session.fromUri,
      to: session.toUri,
      duration: new Date().getTime() - session.startTime.getTime(),
      hasVideo: session.hasVideo
    });
  });

  bridge.on('callEnded', (session) => {
    const duration = session.endTime 
      ? session.endTime.getTime() - session.startTime.getTime()
      : 0;
    
    console.log('📞 Chamada finalizada:', {
      sessionId: session.sessionId,
      duration: Math.round(duration / 1000) + 's',
      status: session.status
    });
  });

  try {
    // Inicializar bridge híbrido
    await bridge.initialize();

    console.log('\n🎯 Bridge Híbrido inicializado com sucesso!');
    console.log('\n📋 Recursos disponíveis:');
    console.log('  🎵 Mídia: SIP.js (otimizado para WebRTC)');
    console.log('  🎛️ Controle: Asterisk AMI (recursos avançados)');
    console.log('  🌐 WebRTC: ConnectyCube (nativo)');
    console.log(`  🔗 AMI Status: ${bridge.isAmiConnected() ? '✅ Conectado' : '❌ Desconectado'}`);
    console.log(`  📞 SIP Status: ${bridge.isRegistered() ? '✅ Registrado' : '❌ Não registrado'}`);

    // Demonstrar recursos AMI
    console.log('\n🧪 Testando recursos AMI...');
    
    // Listar canais ativos
    const activeChannels = bridge.getAsteriskChannels();
    console.log(`📊 Canais ativos no Asterisk: ${activeChannels.size}`);

    // Simular controle de chamadas via AMI
    setTimeout(async () => {
      console.log('\n🎛️ Demonstrando controle via AMI...');
      
      try {
        // Exemplo: Originar chamada via AMI
        console.log('📞 Originando chamada via AMI...');
        const originateResult = await bridge.originateCallViaAmi(
          'SIP/1001',    // Canal origem
          '2000',        // Destino
          'usuarios_internos' // Contexto
        );
        console.log(`✅ Chamada originada: ${originateResult}`);

        // Exemplo: Transferir chamada (simulado)
        setTimeout(async () => {
          console.log('🔄 Exemplo de transferência via AMI...');
          const transferResult = await bridge.transferCallViaAmi(
            'SIP/1001-00000001', // Canal
            '3000',              // Destino
            'usuarios_internos'  // Contexto
          );
          console.log(`✅ Transferência: ${transferResult}`);
        }, 5000);

      } catch (error) {
        console.log('ℹ️ Comandos AMI simulados (Asterisk pode não estar rodando)');
      }
    }, 3000);

    // Manter processo ativo
    console.log('\n⏳ Aguardando chamadas... (Ctrl+C para sair)');
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🔌 Iniciando shutdown...');
      await bridge.shutdown();
      console.log('👋 Bridge finalizado');
      process.exit(0);
    });

    // Manter processo ativo
    setInterval(() => {
      const stats = {
        mode: bridge.getBridgeMode(),
        amiConnected: bridge.isAmiConnected(),
        sipRegistered: bridge.isRegistered(),
        activeSessions: bridge.getActiveSessions().size,
        asteriskChannels: bridge.getAsteriskChannels().size
      };
      
      console.log(`\n📊 Status (${new Date().toLocaleTimeString()}):`, stats);
    }, 30000);

  } catch (error) {
    console.error('❌ Erro ao inicializar bridge híbrido:', error);
    process.exit(1);
  }
}

// Executar exemplo
exemploHibrido().catch(console.error);

/**
 * 🏗️ Configuração necessária no Asterisk:
 * 
 * 1. manager.conf:
 * [general]
 * enabled = yes
 * port = 5038
 * bindaddr = 127.0.0.1
 * 
 * [bridge_ami]
 * secret = bridge_secret
 * read = all
 * write = all
 * 
 * 2. extensions.conf:
 * [usuarios_internos]
 * exten => _X.,1,NoOp(Bridge: Chamada de ${CALLERID(num)} para ${EXTEN})
 * exten => _X.,n,UserEvent(BridgeCall,Channel: ${CHANNEL},From: ${CALLERID(num)},To: ${EXTEN})
 * exten => _X.,n,Wait(300)
 * exten => _X.,n,Hangup()
 * 
 * 3. sip.conf (exemplo):
 * [1001]
 * type=friend
 * secret=senha123
 * host=dynamic
 * context=usuarios_internos
 * 
 * 4. Variáveis de ambiente (.env):
 * AMI_HOST=localhost
 * AMI_PORT=5038
 * AMI_USERNAME=bridge_ami
 * AMI_SECRET=bridge_secret
 * SIP_DOMAIN=localhost
 * SIP_USERNAME=bridge_user
 * SIP_PASSWORD=bridge_password
 * CONNECTYCUBE_APP_ID=12345
 * CONNECTYCUBE_AUTH_KEY=sua_auth_key
 * CONNECTYCUBE_AUTH_SECRET=sua_auth_secret
 * CONNECTYCUBE_ACCOUNT_KEY=sua_account_key
 */
