/**
 * Exemplo SIP Direto: Fone SIP → ConnectyCube
 * 
 * Este exemplo demonstra como conectar DIRETAMENTE um fone SIP
 * ao ConnectyCube, sem passar pelo Asterisk.
 * 
 * SISTEMA DE MAPEAMENTO EXCLUSIVO:
 * - Cada SIP URI tem credenciais ConnectyCube exclusivas
 * - Usuários não compartilham sessões
 * - Segurança aprimorada
 * - Rastreamento individual
 * 
 * VANTAGENS:
 * - Menos latência (sem intermediário)
 * - Mais simples (menos componentes)
 * - Melhor qualidade (menos conversões)
 * - Controle direto do SIP
 * - Usuários exclusivos por departamento
 */

import { SipDirectBridge } from './src/services/sip-direct-bridge.service';
import { SIP_USER_MAPPINGS, MAPPING_STATS } from './src/config/sip-user-mappings';

// Configuração direta SIP → ConnectyCube
const sipDirectConfig = {
  port: 3000,
  
  // Configuração do servidor SIP
  sip: {
    domain: 'sip.meudominio.com',
    port: 5060,
    transport: 'UDP' as const,
    username: 'usuario_sip',
    password: 'senha_sip',
    
    // Configurações de registro
    registrar: 'sip.meudominio.com:5060',
    registerInterval: 300, // segundos
    
    // Codecs de áudio suportados
    audioCodecs: ['PCMU', 'PCMA', 'G729', 'G722'],
    
    // Codecs de vídeo suportados
    videoCodecs: ['H264', 'VP8', 'VP9'],
    
    // Configurações RTP
    rtpPortRange: {
      min: 10000,
      max: 20000
    },
    
    // Modo DTMF
    dtmfMode: 'RFC2833' as const
  },
  
  // Configuração ConnectyCube
  connectyCube: {
    appId: '5142',
    authKey: 'tdNXZbdB4D7aAzR',
    authSecret: 'vvqkODFqBsHrLwS',
    accountKey: '6591',
    videoConfig: {
      defaultVideoEnabled: true,
      videoFromSipPhoneOnly: true, // Vídeo apenas do telefone SIP
      audioBidirectional: true
    }
  }
  
  // 🆕 NOVO SISTEMA: Mapeamento SIP → ConnectyCube (credenciais exclusivas)
  // Configuração agora está em: src/config/sip-user-mappings.ts
  // Cada usuário SIP tem credenciais ConnectyCube exclusivas
};

const sipBridge = new SipDirectBridge(sipDirectConfig);

// Mostrar informações do sistema de mapeamento
console.log('🔧 Inicializando ponte SIP direta...\n');

console.log('📊 SISTEMA DE MAPEAMENTO EXCLUSIVO:');
console.log(`   👥 Total de usuários: ${MAPPING_STATS.totalUsers}`);
console.log(`   🏢 Departamentos: ${MAPPING_STATS.departments.join(', ')}`);
console.log(`   📞 SIP URIs: ${MAPPING_STATS.sipUris.length} configurados`);
console.log(`   🆔 ConnectyCube IDs: ${MAPPING_STATS.connectyCubeUserIds.join(', ')}\n`);

console.log('👤 USUÁRIOS MAPEADOS:');
SIP_USER_MAPPINGS.forEach((mapping, index) => {
  console.log(`   ${index + 1}. 📞 ${mapping.sipUri}`);
  console.log(`      👤 ConnectyCube: ${mapping.connectyCube.username} (ID: ${mapping.connectyCube.userId})`);
  console.log(`      🏢 ${mapping.department} - ${mapping.name}\n`);
});

console.log('=== BENEFÍCIOS SIP DIRETO ===');
console.log('🚀 Menor latência (sem Asterisk intermediário)');
console.log('🎯 Controle direto do protocolo SIP');
console.log('📱 Suporte nativo a fones SIP/softphones');
console.log('🔧 Configuração mais simples');
console.log('💰 Menor custo de infraestrutura');
console.log('🌐 Compatível com qualquer provedor SIP');
console.log('📹 Suporte completo a vídeo bidirecional');
console.log('🔊 Áudio de alta qualidade (G.722, Opus)');
console.log('👥 Credenciais ConnectyCube exclusivas por usuário');
console.log('🔒 Segurança aprimorada - isolamento de sessões\n');

// Inicializar ponte SIP direta
sipBridge.initialize().then(() => {
  console.log('🚀 Ponte SIP Direto → ConnectyCube iniciada!');
  console.log('📞 Aguardando chamadas diretas do fone SIP...\n');
  
  // Demonstração do fluxo SIP direto
  console.log('=== FLUXO SIP DIRETO (SEM ASTERISK) ===');
  console.log('1. 📱 Fone SIP registra no servidor');
  console.log('2. 🔗 Bridge estabelece sessão SIP');
  console.log('3. 📞 Fone SIP inicia chamada diretamente');
  console.log('4. 🎯 Bridge mapeia SIP URI → ConnectyCube User');
  console.log('5. 🔐 Faz login ConnectyCube automaticamente');
  console.log('6. 📹 Inicia chamada WebRTC direta');
  console.log('7. 🌉 Conecta RTP (SIP) ↔ WebRTC (ConnectyCube)');
  console.log('8. ✅ Mídia fluindo diretamente');
  console.log('9. 🔚 Cleanup automático\n');
  
  // Exemplos de cenários SIP diretos
  const exemplosSip = [
    {
      cenario: 'Chamada de vídeo direta do fone SIP de vendas',
      from: 'sip:vendas@meudominio.com',
      to: 'sip:cliente@external.com',
      connectyCubeUser: 12345,
      videoEnabled: true
    },
    {
      cenario: 'Chamada de áudio do suporte',
      from: 'sip:suporte@meudominio.com',
      to: 'sip:cliente@external.com',
      connectyCubeUser: 12346,
      videoEnabled: false
    },
    {
      cenario: 'Chamada de conferência da gerência',
      from: 'sip:gerencia@meudominio.com', 
      to: 'sip:reuniao@external.com',
      connectyCubeUser: 12347,
      videoEnabled: true
    }
  ];
  
  exemplosSip.forEach((exemplo, index) => {
    console.log(`Exemplo SIP ${index + 1}: ${exemplo.cenario}`);
    console.log(`  📞 SIP: ${exemplo.from} → ${exemplo.to}`);
    console.log(`  👤 ConnectyCube User ID: ${exemplo.connectyCubeUser}`);
    console.log(`  📹 Vídeo: ${exemplo.videoEnabled ? 'SIM (SIP → ConnectyCube)' : 'NÃO'}`);
    console.log(`  🔊 Áudio: Bidirecional (RTP ↔ WebRTC)`);
    console.log('  ✓ Sem intermediários - conexão direta\n');
  });
  
}).catch(error => {
  console.error('❌ Erro ao inicializar ponte SIP:', error);
});

// Event handlers para chamadas SIP diretas
sipBridge.on('sipRegistered', (sipUri: string) => {
  console.log('📋 Fone SIP registrado:', sipUri);
});

sipBridge.on('incomingCall', (callData: any) => {
  console.log('📞 Chamada SIP recebida:', {
    from: callData.fromUri,
    to: callData.toUri,
    callId: callData.sipCallId,
    hasVideo: callData.hasVideo
  });
});

sipBridge.on('callBridged', (bridgeData: any) => {
  console.log('🌉 Chamada SIP → ConnectyCube conectada:', {
    sipCallId: bridgeData.sipCallId,
    connectyCubeUserId: bridgeData.connectyCubeUserId,
    sessionId: bridgeData.sessionId
  });
});

sipBridge.on('callConnected', (session: any) => {
  console.log('✅ Chamada SIP estabelecida:', {
    sessionId: session.sessionId,
    sipCallId: session.sipCallId,
    fromUri: session.fromUri,
    toUri: session.toUri,
    connectyCubeUserId: session.connectyCubeUserId,
    hasVideo: session.hasVideo,
    status: session.status
  });
});

sipBridge.on('mediaFlowing', (mediaData: any) => {
  console.log('🎵 Mídia fluindo:', {
    sessionId: mediaData.sessionId,
    audioCodec: mediaData.audioCodec,
    videoCodec: mediaData.videoCodec,
    rtpStats: mediaData.rtpStats
  });
});

sipBridge.on('callEnded', (endData: any) => {
  console.log('🔚 Chamada SIP finalizada:', {
    sessionId: endData.sessionId,
    sipCallId: endData.sipCallId,
    duration: endData.duration ? `${endData.duration}s` : 'N/A',
    reason: endData.reason
  });
});

sipBridge.on('callRejected', (session: any) => {
  console.log('❌ Chamada SIP rejeitada:', {
    sessionId: session.sessionId,
    sipCallId: session.sipCallId,
    fromUri: session.fromUri,
    toUri: session.toUri
  });
});

sipBridge.on('sipError', (error: any) => {
  console.error('❌ Erro SIP:', error);
});

console.log('\n=== BENEFÍCIOS SIP DIRETO ===');
console.log('🚀 Menor latência (sem Asterisk intermediário)');
console.log('🎯 Controle direto do protocolo SIP');
console.log('📱 Suporte nativo a fones SIP/softphones');
console.log('🔧 Configuração mais simples');
console.log('💰 Menor custo de infraestrutura');
console.log('🌐 Compatível com qualquer provedor SIP');
console.log('📹 Suporte completo a vídeo bidirecional');
console.log('🔊 Áudio de alta qualidade (G.722, Opus)');

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔌 Desligando ponte SIP...');
  await sipBridge.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔌 Desligando ponte SIP...');
  await sipBridge.shutdown();
  process.exit(0);
});
