// ==============================================================================
// CONFIGURAÇÃO DO SISTEMA (System Configuration)
// ==============================================================================
// Define comportamento estrutural do sistema.
// Alterável SOMENTE por ADMIN.
// Afeta múltiplos usuários ou módulos.

export interface SystemConfig {
  // Controle de Módulos
  kanbanAtivo: boolean;
  
  // Comportamento Operacional
  impressaoAutomatica: boolean;
  modoRestrito: boolean; // Se true, aplica regras mais rígidas de validação
  exibirPendenciasGlobais: boolean; // Se true, usuários comuns podem ver pendências de outros setores (exemplo)

  // Flags de Manutenção
  modoManutencao: boolean;
}

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  kanbanAtivo: true,
  impressaoAutomatica: false,
  modoRestrito: false,
  exibirPendenciasGlobais: false,
  modoManutencao: false
};
