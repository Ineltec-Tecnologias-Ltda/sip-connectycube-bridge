/**
 * Mapeamento SIP → ConnectyCube Users
 * 
 * Cada usuário SIP tem credenciais exclusivas no ConnectyCube
 */

export interface SipUserMapping {
  sipUri: string;
  connectyCube: {
    username: string;
    password: string;
    userId: number;
  };
  department?: string;
  name?: string;
}

/**
 * 📋 MAPEAMENTO PROVISÓRIO - Constantes Fictícias
 * 
 * Cada fone SIP mapeia para um usuário ConnectyCube exclusivo
 * Em produção, buscar de banco de dados ou arquivo de configuração
 */
export const SIP_USER_MAPPINGS: SipUserMapping[] = [
  // Equipe de Vendas
  {
    sipUri: 'sip:vendas@meudominio.com',
    connectyCube: {
      username: 'vendas_conectycube',
      password: 'senha_vendas_123',
      userId: 12345
    },
    department: 'Vendas',
    name: 'João Vendedor'
  },
  
  // Equipe de Suporte
  {
    sipUri: 'sip:suporte@meudominio.com',
    connectyCube: {
      username: 'suporte_conectycube',
      password: 'senha_suporte_456',
      userId: 12346
    },
    department: 'Suporte',
    name: 'Maria Atendimento'
  },
  
  // Gerência
  {
    sipUri: 'sip:gerencia@meudominio.com',
    connectyCube: {
      username: 'gerencia_conectycube',
      password: 'senha_gerencia_789',
      userId: 12347
    },
    department: 'Gerência',
    name: 'Carlos Gerente'
  },
  
  // Marketing
  {
    sipUri: 'sip:marketing@meudominio.com',
    connectyCube: {
      username: 'marketing_conectycube',
      password: 'senha_marketing_101',
      userId: 12348
    },
    department: 'Marketing',
    name: 'Ana Marketing'
  },
  
  // Financeiro
  {
    sipUri: 'sip:financeiro@meudominio.com',
    connectyCube: {
      username: 'financeiro_conectycube',
      password: 'senha_financeiro_202',
      userId: 12349
    },
    department: 'Financeiro',
    name: 'Pedro Financeiro'
  },
  
  // Receptionist
  {
    sipUri: 'sip:recepcao@meudominio.com',
    connectyCube: {
      username: 'recepcao_conectycube',
      password: 'senha_recepcao_303',
      userId: 12350
    },
    department: 'Recepção',
    name: 'Julia Recepcionista'
  },
  
  // CEO
  {
    sipUri: 'sip:ceo@meudominio.com',
    connectyCube: {
      username: 'ceo_conectycube',
      password: 'senha_ceo_999',
      userId: 12351
    },
    department: 'Diretoria',
    name: 'Roberto CEO'
  }
];

/**
 * Função helper para encontrar mapeamento por SIP URI
 */
export function findUserMappingBySipUri(sipUri: string): SipUserMapping | undefined {
  return SIP_USER_MAPPINGS.find(mapping => mapping.sipUri === sipUri);
}

/**
 * Função helper para encontrar mapeamento por ConnectyCube User ID
 */
export function findUserMappingByConnectyCubeId(userId: number): SipUserMapping | undefined {
  return SIP_USER_MAPPINGS.find(mapping => mapping.connectyCube.userId === userId);
}

/**
 * Função helper para listar todos os usuários de um departamento
 */
export function getUsersByDepartment(department: string): SipUserMapping[] {
  return SIP_USER_MAPPINGS.filter(mapping => mapping.department === department);
}

/**
 * Função helper para validar se SIP URI tem mapeamento
 */
export function hasSipUserMapping(sipUri: string): boolean {
  return SIP_USER_MAPPINGS.some(mapping => mapping.sipUri === sipUri);
}

/**
 * 📊 ESTATÍSTICAS DO MAPEAMENTO
 */
export const MAPPING_STATS = {
  totalUsers: SIP_USER_MAPPINGS.length,
  departments: [...new Set(SIP_USER_MAPPINGS.map(m => m.department))],
  sipUris: SIP_USER_MAPPINGS.map(m => m.sipUri),
  connectyCubeUserIds: SIP_USER_MAPPINGS.map(m => m.connectyCube.userId)
};

/**
 * 🔧 CONFIGURAÇÃO EM PRODUÇÃO
 * 
 * Em ambiente de produção, substituir por:
 * 
 * 1. Banco de Dados:
 *    - Tabela sip_users
 *    - Tabela connectycube_credentials
 *    - Join para buscar credenciais
 * 
 * 2. Arquivo de Configuração:
 *    - JSON, YAML ou ENV
 *    - Carregamento dinâmico
 * 
 * 3. API Externa:
 *    - Sistema de usuários existente
 *    - Cache local para performance
 * 
 * 4. Vault/Secrets Manager:
 *    - Credenciais seguras
 *    - Rotação automática
 */
