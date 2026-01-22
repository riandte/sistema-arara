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
  log(event: AuditEvent, actorId: string, details?: any, targetId?: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO', ip?: string) {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      actorId,
      targetId,
      ip,
      details
    };
    
    // In a real production system, this would go to a database or a log aggregator (ELK, Splunk, Datadog).
    // For this sovereign backend, we output structured JSON to stdout, which is 12-factor app compliant.
    console.log(JSON.stringify(entry));
  }
};
