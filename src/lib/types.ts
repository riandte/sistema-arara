
export interface User {
  id: string;
  name: string;
  email: string;
  roles: RoleName[];
  active?: boolean;
  // Vínculos organizacionais (opcionais na interface base, mas usados no sistema)
  setorId?: string;
  cargoId?: string;
  funcionario?: Funcionario; // Dados expandidos
}

// ==============================================================================
// ENUMS E TIPOS LITERAIS
// ==============================================================================

/**
 * Tipos possíveis de uma Pendência.
 * Define a natureza do trabalho a ser realizado.
 */
export type TipoPendencia = 
  | 'OS'              // Originada de uma Ordem de Serviço
  | 'ADMINISTRATIVO'  // Tarefas internas, RH, compras
  | 'FINANCEIRO'      // Contas a pagar, faturamento
  | 'TI'              // Suporte, equipamentos, sistemas
  | 'COMERCIAL'       // Vendas, propostas
  | 'OUTRO';          // Tarefas genéricas

/**
 * Ciclo de vida da Pendência.
 * Base para o futuro sistema Kanban.
 */
export type StatusPendencia = 
  | 'PENDENTE'      // Criada, aguardando início (Backlog/To Do)
  | 'EM_ANDAMENTO'  // Sendo executada (Doing)
  | 'CONCLUIDO'     // Finalizada com sucesso (Done)
  | 'CANCELADO'     // Finalizada sem execução (LEGADO, manter por compatibilidade)
  | 'ENCERRADA_SEM_CONCLUSAO'; // Encerrada sem sucesso (Substitui Cancelado no fluxo manual)

/**
 * Nível de urgência da tarefa.
 */
export type PrioridadePendencia = 'BAIXA' | 'MEDIA' | 'ALTA';

/**
 * Setores disponíveis para atribuição
 */
export type SetorResponsavel = string; // Agora usa IDs dos setores (ex: 'setor-ti'), não enum fixo

/**
 * Define a origem da Pendência.
 * Fundamental para rastreabilidade.
 */
export type OrigemPendencia = 'OS' | 'MANUAL';

// ==============================================================================
// ENTIDADE PRINCIPAL
// ==============================================================================

/**
 * Entidade PENDÊNCIA
 * Núcleo do sistema LocApp Next.
 * Representa uma unidade de trabalho atômica e rastreável.
 */
export interface Pendencia {
  // Identificação
  id: string; // UUID v4
  titulo: string; // Resumo curto do trabalho
  descricao?: string; // Detalhamento completo (Opcional)

  // Classificação
  tipo: TipoPendencia;
  status: StatusPendencia;
  prioridade: PrioridadePendencia;

  // Relações e Vínculos
  // Se origemTipo === 'OS', origemId DEVE ser o ID da OS.
  origemId?: string; 
  origemTipo: OrigemPendencia;

  // Responsabilidades (Auditoria de Atores)
  criadoPor: string; // ID do usuário que criou (Sistema ou Humano)
  responsavelId?: string; // ID do usuário atribuído para execução (Opcional no início)
  setorResponsavel?: SetorResponsavel; // Atribuição por setor (Novo)

  // Encerramento
  conclusao?: string; // Texto obrigatório para encerramento manual
  tipoEncerramento?: 'CONCLUIDO' | 'SEM_CONCLUSAO'; // Persistência explícita do motivo

  // Auditoria Temporal (Datas Relevantes)
  dataCriacao: string; // ISO 8601 (Imutável após criação)
  dataAtualizacao?: string; // ISO 8601 (Última modificação)
  dataConclusao?: string; // ISO 8601 (Preenchido apenas quando status = CONCLUIDO)
  dataPrevisao?: string; // ISO 8601 (Deadline desejado)

  // Metadados
  tags?: string[]; // Marcadores para busca rápida
}

// --- CONTROLE DE ACESSO (RBAC) ---

export type RoleName = string;

export interface Role {
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem?: boolean; // Se true, não pode ser excluído
  userCount?: number; // Campo calculado para listagem
}

// ==============================================================================
// ESTRUTURA ORGANIZACIONAL (SETOR, CARGO, FUNCIONÁRIO)
// ==============================================================================

/**
 * Escopo de atuação do Cargo
 * INDIVIDUAL: Vê apenas o que é atribuído a si
 * SETORIAL: Vê tudo do seu setor
 */
export type EscopoAtuacao = 'INDIVIDUAL' | 'SETORIAL';

export interface Setor {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  // Metadata
  createdAt: string;
  updatedAt?: string;
}

export interface Cargo {
  id: string;
  nome: string;
  descricao?: string;
  setoresPermitidos: string[]; // IDs dos setores onde este cargo pode atuar
  escopo: EscopoAtuacao;
  ativo: boolean;
  // Metadata
  createdAt: string;
  updatedAt?: string;
}

export interface Funcionario {
  id: string;
  nome: string;
  emailCorporativo: string;
  setorId: string;
  cargoId: string;
  usuarioId?: string; // Link com Usuário do Sistema (Login)
  ativo: boolean;
  // Metadata
  createdAt: string;
  updatedAt?: string;
}

export type Permission = 
  | 'PENDENCIA:LER_TODAS'
  | 'PENDENCIA:CRIAR'
  | 'PENDENCIA:EDITAR' // Edição geral (título, descrição, prioridade)
  | 'PENDENCIA:MOVER'  // Mudança de status via Kanban
  | 'PENDENCIA:CONCLUIR'
  | 'PENDENCIA:CANCELAR'
  | 'PENDENCIA:ATRIBUIR_RESPONSAVEL'
  | 'USUARIO:GERENCIAR'
  | 'OS:CRIAR';

/**
 * Registro de histórico de movimentação da Pendência.
 * Essencial para o rastreamento do Kanban.
 */
export interface HistoricoMovimentacao {
  id: string; // UUID v4
  pendenciaId: string; // FK para Pendencia
  
  // Auditoria da Ação
  dataMovimentacao: string; // ISO 8601
  usuarioId: string; // Quem realizou a mudança
  
  // Transição de Estado
  statusAnterior: StatusPendencia;
  statusNovo: StatusPendencia;
  
  // Contexto
  observacao?: string; // Obrigatório para CANCELADO, opcional para outros
}

// ==============================================================================
// TIPOS AUXILIARES (LEGADO/INTEGRAÇÃO)
// ==============================================================================

export interface OrdemServicoInput {
  cliente: {
    codigo: number;
    nome: string;
    documento: string;
  };
  contrato?: string; // Para lógica de numeração personalizada
  endereco: string;
  contato: string;
  prioridade: PrioridadePendencia;
  dataPrevista: string;
  descricao: string;
  observacoes?: string;
}

export interface ServiceOrder {
  id: string;
  number: number;
  clientData: any; // Pode tipar melhor se quiser
  status: 'ABERTA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
  priority: PrioridadePendencia;
  description: string;
  scheduledDate: string; // ISO Date
  createdAt: string;
  updatedAt: string;
}
