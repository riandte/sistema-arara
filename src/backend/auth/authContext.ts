import { RoleName, Funcionario, Cargo, Setor } from '@/shared/types';
import { SystemConfig } from '@/backend/config/systemConfig';
import { UserParameters } from '@/backend/config/systemParameters';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  roles: RoleName[];
  // Dados do Funcionário Vinculado (Competência)
  funcionario?: {
    id: string;
    setorId: string;
    cargoId: string;
    escopo: 'INDIVIDUAL' | 'SETORIAL';
  };
}

export interface AuthContext {
  user: UserSession;
}

/**
 * Entidade Completa de Usuário (Persistência)
 * ... mantendo o resto igual
 */
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Opcional, apenas para mock auth simples
  roles: RoleName[];
  active: boolean;

  // Configurações e Parâmetros
  configuracoes?: SystemConfig; // Opcional pois pode herdar global, mas no mock vamos preencher
  parametros: UserParameters;

  createdAt: string;
  updatedAt?: string;
}
