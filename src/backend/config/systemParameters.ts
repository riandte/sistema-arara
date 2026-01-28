// ==============================================================================
// PARÂMETROS DO USUÁRIO (User Parameters)
// ==============================================================================
// Define preferências operacionais e de experiência.
// Escopo: Usuário / Sessão.
// Alterável pelo próprio usuário.
// NUNCA impacta regras de negócio ou permissões.

export interface UserParameters {
  // Interface (UI/UX)
  densidadeUI: 'compact' | 'comfortable';
  tema: 'light' | 'dark' | 'system';
  
  // Preferências de Visualização
  colunasKanbanVisiveis: string[]; // IDs das colunas
  filtrosPadrao: Record<string, any>; // Ex: { status: 'PENDENTE' }
  
  // Localização e Formatação
  idioma: 'pt-BR' | 'en-US';
  timezone: string;
}

export const DEFAULT_USER_PARAMETERS: UserParameters = {
  densidadeUI: 'comfortable',
  tema: 'system',
  colunasKanbanVisiveis: ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO'],
  filtrosPadrao: {},
  idioma: 'pt-BR',
  timezone: 'America/Sao_Paulo'
};
