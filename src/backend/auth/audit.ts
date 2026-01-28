import { prisma } from '@/backend/db';

export type AuditEvent = 
  | 'LOGIN_SUCCESS' 
  | 'LOGIN_FAILURE' 
  | 'ACCESS_DENIED' 
  | 'USER_CREATED' 
  | 'USER_UPDATED' 
  | 'PENDENCIA_CRIADA' 
  | 'PENDENCIA_ATUALIZADA' 
  | 'PENDENCIA_CONCLUIDA'
  | 'PENDENCIA_CRIACAO_FALHA'
  | 'SYSTEM_EVENT';

export interface AuditLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  event: AuditEvent;
  actorId: string; // User ID or 'system' or 'anonymous'
  targetId?: string; // Resource ID being acted upon
  ip?: string;
  details?: any;
}

export const AuditService = {
  async log(event: AuditEvent, actorId: string, details?: any, targetId?: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO', ip?: string) {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      actorId,
      targetId,
      ip,
      details
    };
    
    // 1. Log to stdout (12-factor app)
    console.log(JSON.stringify(entry));

    // 2. Persist to Database (Audit History)
    try {
      await prisma.auditEvent.create({
        data: {
          level,
          event,
          actorId,
          targetId,
          ip,
          details: details || {}
        }
      });
    } catch (error) {
      console.error('❌ Falha ao persistir log de auditoria:', error);
      // Não lançamos erro para não interromper o fluxo principal
    }
  }
};
