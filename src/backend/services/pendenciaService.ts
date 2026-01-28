import { randomUUID } from 'crypto';
import { Pendencia, StatusPendencia, TipoPendencia, PrioridadePendencia, OrigemPendencia } from '@/shared/types';
import { AuthContext } from '../auth/authContext';
import { assertPermission, hasPermission, ForbiddenError } from '../auth/permissions';
import { prisma } from '@/backend/db';
import { PendencyStatus, PendencyType, Priority, OriginType, ConclusionType, Prisma } from '@prisma/client';
import { AuditService } from '@/backend/auth/audit';

// Helper de Auditoria (Mantido para compatibilidade, mas idealmente seria salvo no banco)
function logAudit(action: string, userId: string, targetId: string, details?: any, success: boolean = true) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: success ? 'INFO' : 'ERROR',
    event: 'AUDIT_LOG',
    action,
    actor: userId,
    target: targetId,
    success,
    details
  }));
}

// Mapper: Prisma -> App
function mapPrismaPendencyToAppPendency(p: any): Pendencia {
  return {
    id: p.id,
    titulo: p.title,
    descricao: p.description || undefined,
    tipo: p.type as TipoPendencia,
    status: p.status as StatusPendencia,
    prioridade: p.priority as PrioridadePendencia,
    origemId: p.originOsId || undefined,
    origemTipo: p.originType as OrigemPendencia,
    criadoPor: p.createdBy,
    responsavelId: p.responsibleId || undefined,
    setorResponsavel: p.responsibleSectorId || undefined,
    conclusao: p.conclusionText || undefined,
    tipoEncerramento: p.conclusionType === 'CONCLUIDO' ? 'CONCLUIDO' : 
                      p.conclusionType === 'SEM_CONCLUSAO' ? 'SEM_CONCLUSAO' : undefined,
    dataCriacao: p.createdAt.toISOString(),
    dataAtualizacao: p.updatedAt.toISOString(),
    dataConclusao: p.completedAt?.toISOString(),
    dataPrevisao: p.dueDate?.toISOString(),
    tags: [] // Schema atual não suporta tags
  };
}

export interface PendenciaFilters {
  status?: string;
  tipo?: string;
  responsavelId?: string;
  setorResponsavel?: string;
  criadoPor?: string;
  dataInicio?: string;
  dataFim?: string;
  termo?: string; // Busca em título/descrição/origemId
}

export const PendenciaService = {
  async listar(context: AuthContext, filters?: PendenciaFilters): Promise<Pendencia[]> {
    // 1. Construir Filtros Base (RBAC + Escopo)
    const where: any = {};

    // Se NÃO tiver permissão global, filtra por escopo
    if (!(await hasPermission(context, 'PENDENCIA:LER_TODAS'))) {
       if (!context.user) return [];
       
       if (!context.user.funcionario) {
           // Se não é funcionário, só vê o que criou (ou nada?)
           // Regra antiga: "Usuário deve estar vinculado a Cargo e Setor"
           // Mas vamos permitir ver as que ele criou por segurança
           where.OR = [
             { createdBy: context.user.id },
             { responsibleId: context.user.id }
           ];
       } else {
           const { setorId, escopo } = context.user.funcionario;
           
           const conditions: any[] = [
             { createdBy: context.user.id },
             { responsibleId: context.user.id }
           ];

           // Se tem escopo SETORIAL, vê itens do setor
           if (escopo === 'SETORIAL') {
               conditions.push({ responsibleSectorId: setorId });
           }

           where.OR = conditions;
       }
    }

    // 2. Aplicar Filtros Avançados
    if (filters) {
        if (filters.status) where.status = filters.status as PendencyStatus;
        if (filters.tipo) where.type = filters.tipo as PendencyType;
        if (filters.responsavelId) where.responsibleId = filters.responsavelId;
        if (filters.setorResponsavel) where.responsibleSectorId = filters.setorResponsavel;
        if (filters.criadoPor) where.createdBy = filters.criadoPor;
        
        if (filters.dataInicio || filters.dataFim) {
            where.createdAt = {};
            if (filters.dataInicio) {
                const dInicio = new Date(filters.dataInicio);
                if (!isNaN(dInicio.getTime())) where.createdAt.gte = dInicio;
            }
            if (filters.dataFim) {
                const dFim = new Date(filters.dataFim);
                if (!isNaN(dFim.getTime())) where.createdAt.lte = dFim;
            }
        }

        if (filters.termo) {
            const t = filters.termo;
            where.AND = [
                {
                    OR: [
                        { title: { contains: t, mode: 'insensitive' } },
                        { description: { contains: t, mode: 'insensitive' } },
                        // originOsId é UUID, busca parcial pode falhar se termo for texto livre
                        // mas se for UUID parcial funciona? Postgres suporta cast?
                        // Prisma 'contains' em String funciona.
                        { originOsId: { contains: t, mode: 'insensitive' } }
                    ]
                }
            ];
        }
    }

    const pendencias = await prisma.pendency.findMany({
        where,
        orderBy: { createdAt: 'desc' }
    });

    return pendencias.map(mapPrismaPendencyToAppPendency);
  },

  async criar(dados: Omit<Pendencia, 'id' | 'dataCriacao'>, context: AuthContext, tx?: Prisma.TransactionClient): Promise<Pendencia> {
    try {
      await assertPermission(context, 'PENDENCIA:CRIAR');
      
      const db = tx || prisma;

      // Validação de Setor
      if (dados.setorResponsavel) {
          const setor = await db.sector.findUnique({ where: { id: dados.setorResponsavel } });
          if (!setor || !setor.active) {
              throw new Error('Setor responsável inválido ou inativo.');
          }
      }

      // Regras de Atribuição
      let responsibleId = dados.responsavelId;
      let responsibleSectorId = dados.setorResponsavel;

      if (dados.origemTipo === 'OS') {
          responsibleId = context.user.id;
          responsibleSectorId = undefined;
      } else {
          if (!responsibleId && !responsibleSectorId) {
              throw new Error('É obrigatório atribuir a pendência a uma Pessoa ou Setor.');
          }
      }

      const novaPendencia = await db.pendency.create({
          data: {
              title: dados.titulo,
              description: dados.descricao,
              type: dados.tipo as PendencyType,
              status: (dados.status as PendencyStatus) || 'PENDENTE',
              priority: (dados.prioridade as Priority) || 'MEDIA',
              originType: dados.origemTipo as OriginType,
              originOsId: dados.origemId || null, // Validação de FK será feita pelo banco
              createdBy: context.user.id,
              responsibleId: responsibleId,
              responsibleSectorId: responsibleSectorId,
              dueDate: dados.dataPrevisao ? new Date(dados.dataPrevisao) : null
          }
      });
      
      AuditService.log('PENDENCIA_CRIADA', context.user.id, { titulo: novaPendencia.title }, novaPendencia.id);
      
      return mapPrismaPendencyToAppPendency(novaPendencia);
    } catch (err: any) {
      AuditService.log('PENDENCIA_CRIACAO_FALHA', context.user?.id || 'anonymous', { error: err.message }, 'new', 'ERROR');
      throw err;
    }
  },

  async atualizar(id: string, dados: Partial<Pendencia>, context: AuthContext): Promise<Pendencia | null> {
    try {
      const original = await prisma.pendency.findUnique({ where: { id } });
      if (!original) return null;

      // --- VALIDAÇÕES DE PERMISSÃO ---

      // 1. Mudança de Status
      if (dados.status && dados.status !== original.status) {
        if (dados.status === 'CONCLUIDO' || dados.status === 'ENCERRADA_SEM_CONCLUSAO') {
          await assertPermission(context, 'PENDENCIA:CONCLUIR');
          
          if (original.originType === 'MANUAL') {
              if (!dados.conclusao) {
                  throw new Error('Para encerrar uma pendência manual, é obrigatório informar a conclusão.');
              }
          }
          // Note: dados.tipoEncerramento é derivado, não precisamos setar no 'dados' input, mas vamos usar na persistência
          
        } else if (dados.status === 'CANCELADO') {
          await assertPermission(context, 'PENDENCIA:CANCELAR');
          
          const isAdmin = context.user.roles.includes('ADMIN');
          const isOwner = original.createdBy === context.user.id;
          
          if (!isAdmin && !isOwner) {
            throw new ForbiddenError('Você só pode cancelar pendências que você criou.');
          }
          
          if (original.status === 'CONCLUIDO' && !isAdmin) {
             throw new ForbiddenError('Não é possível cancelar uma pendência já concluída.');
          }
        } else {
          // Mover (Kanban)
          await assertPermission(context, 'PENDENCIA:MOVER');
        }
      }

      // 2. Edição de Conteúdo
      if (dados.titulo || dados.descricao || dados.prioridade || dados.tipo) {
        await assertPermission(context, 'PENDENCIA:EDITAR');
      }

      // 3. Atribuição
      if ((dados.responsavelId !== undefined && dados.responsavelId !== original.responsibleId) ||
          (dados.setorResponsavel !== undefined && dados.setorResponsavel !== original.responsibleSectorId)) {
        await assertPermission(context, 'PENDENCIA:ATRIBUIR_RESPONSAVEL');
      }
      
      // Impede edição de conclusão após encerrado
      if (dados.conclusao && (original.status === 'CONCLUIDO' || original.status === 'ENCERRADA_SEM_CONCLUSAO')) {
          const isReopening = dados.status && dados.status !== 'CONCLUIDO' && dados.status !== 'ENCERRADA_SEM_CONCLUSAO';
          if (!isReopening) {
              throw new ForbiddenError('Não é possível editar a conclusão de uma pendência encerrada.');
          }
      }

      // Preparar dados para update
      const updateData: any = {};
      if (dados.titulo) updateData.title = dados.titulo;
      if (dados.descricao) updateData.description = dados.descricao;
      if (dados.tipo) updateData.type = dados.tipo as PendencyType;
      if (dados.status) updateData.status = dados.status as PendencyStatus;
      if (dados.prioridade) updateData.priority = dados.prioridade as Priority;
      if (dados.responsavelId !== undefined) updateData.responsibleId = dados.responsavelId;
      if (dados.setorResponsavel !== undefined) updateData.responsibleSectorId = dados.setorResponsavel;
      if (dados.conclusao) updateData.conclusionText = dados.conclusao;
      if (dados.dataPrevisao) updateData.dueDate = new Date(dados.dataPrevisao);

      // Lógica de Encerramento
      if (dados.status === 'CONCLUIDO') {
          updateData.completedAt = new Date();
          updateData.conclusionType = 'CONCLUIDO';
      } else if (dados.status === 'ENCERRADA_SEM_CONCLUSAO') {
          updateData.completedAt = new Date();
          updateData.conclusionType = 'SEM_CONCLUSAO';
      } else if (dados.status) {
          // Reabrindo
          updateData.completedAt = null;
          updateData.conclusionType = null;
      }

      // Transação para Update + Histórico + Automação
      const updatedPendency = await prisma.$transaction(async (tx) => {
          // 1. Update Principal
          const updated = await tx.pendency.update({
              where: { id },
              data: updateData
          });

          // 2. Histórico
          if (dados.status && dados.status !== original.status) {
              await tx.pendencyHistory.create({
                  data: {
                      pendencyId: id,
                      userId: context.user.id,
                      oldStatus: original.status,
                      newStatus: dados.status as PendencyStatus,
                      observation: dados.conclusao // Usa conclusão como obs se houver
                  }
              });
          }

          // 3. Automação: Financeiro
          if (original.type === 'OS' && dados.status === 'CONCLUIDO' && original.status !== 'CONCLUIDO') {
              await tx.pendency.create({
                  data: {
                      title: `Faturamento OS #${original.originOsId || original.title}`,
                      description: `Gerado automaticamente após conclusão da OS #${original.originOsId || original.title}. Referência: ${original.title}`,
                      type: 'FINANCEIRO',
                      status: 'PENDENTE',
                      priority: 'MEDIA',
                      originType: 'OS',
                      originOsId: original.originOsId,
                      createdBy: context.user.id, // Automator is the user who concluded the OS
                      // Se 'system-automation' não é um UUID válido na tabela Users, vai dar erro de FK.
                      // Melhor usar o context.user.id ou um ID de sistema fixo se existir.
                      // Vou usar context.user.id por segurança de FK, ou deixar nulo se createdBy fosse opcional (mas não é).
                      // Vou assumir que quem concluiu a OS disparou o faturamento.
                      // createdBy: context.user.id 
                  }
              });
              // Nota: 'createdBy' é FK para User. Se eu usar 'system-automation', deve existir esse user.
              // Como não tenho garantia, vou usar o ID do usuário atual.
          }
          
          return updated;
      });

      // Correção da automação acima: Eu não posso alterar o bloco da transação depois de fechado ali.
      // Vou ajustar o bloco acima para usar context.user.id na automação.

      logAudit('PENDENCIA_ATUALIZADA', context.user.id, id, { 
        changes: Object.keys(dados),
        from: original.status,
        to: dados.status 
      });
      
      return mapPrismaPendencyToAppPendency(updatedPendency);
    } catch (err: any) {
      logAudit('PENDENCIA_ATUALIZACAO_FALHA', context.user?.id || 'anonymous', id, { error: err.message }, false);
      throw err;
    }
  },
  
  async buscarPorId(id: string, context: AuthContext): Promise<Pendencia | null> {
    const p = await prisma.pendency.findUnique({ where: { id } });
    
    if (!p) return null;

    // Validação de Visibilidade
    if (await hasPermission(context, 'PENDENCIA:LER_TODAS')) {
      return mapPrismaPendencyToAppPendency(p);
    }
    
    // Visibilidade ABAC (Dono ou Responsável)
    if (context.user) {
        if (p.createdBy === context.user.id || p.responsibleId === context.user.id) {
            return mapPrismaPendencyToAppPendency(p);
        }

        // Visibilidade Setorial
        if (context.user.funcionario) {
            const { setorId, escopo } = context.user.funcionario;
            if (escopo === 'SETORIAL' && p.responsibleSectorId === setorId) {
                return mapPrismaPendencyToAppPendency(p);
            }
        }
    }

    throw new ForbiddenError('Você não tem permissão para visualizar esta pendência.');
  }
};
