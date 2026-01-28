import { prisma } from '@/backend/db';
import { AuthContext } from '@/backend/auth/authContext';
import { assertPermission } from '@/backend/auth/permissions';
import { ServiceOrder, OrdemServicoInput } from '@/shared/types';
import { PendenciaService } from './pendenciaService';
import { Priority } from '@prisma/client';

function mapPrismaToApp(os: any): ServiceOrder {
  return {
    id: os.id,
    number: os.number,
    clientData: os.clientData,
    status: os.status,
    priority: os.priority,
    description: os.description,
    scheduledDate: os.scheduledDate.toISOString(),
    createdAt: os.createdAt.toISOString(),
    updatedAt: os.updatedAt.toISOString()
  };
}

export const ServiceOrderService = {
  async list(context: AuthContext): Promise<ServiceOrder[]> {
    // 1. Verificação de Permissão / Visibilidade
    const isAdmin = context.user.roles.includes('ADMIN');
    const isSystem = context.user.roles.includes('SISTEMA');

    if (!isAdmin && !isSystem) {
        if (!context.user.funcionario) {
             throw new Error('Acesso negado. É necessário estar vinculado a um Cargo e Setor para visualizar demandas.');
        }
    }

    // 2. Busca no Banco
    const orders = await prisma.serviceOrder.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return orders.map(mapPrismaToApp);
  },

  async getById(id: string, context: AuthContext): Promise<ServiceOrder | null> {
      // Reutiliza lógica de visibilidade do list? 
      // Por enquanto, permite se tiver acesso ao módulo
      const isAdmin = context.user.roles.includes('ADMIN');
      const isSystem = context.user.roles.includes('SISTEMA');
      
      if (!isAdmin && !isSystem && !context.user.funcionario) {
          throw new Error('Acesso negado.');
      }

      const os = await prisma.serviceOrder.findUnique({ where: { id } });
      return os ? mapPrismaToApp(os) : null;
  },

  async create(data: OrdemServicoInput, context: AuthContext): Promise<ServiceOrder> {
    await assertPermission(context, 'OS:CRIAR');

    // 1. Lógica de ID Personalizado (Contrato)
    let customId: string | undefined;

    if (data.contrato) {
        const prefix = `${data.contrato}-`;
        // Busca IDs que começam com o prefixo para determinar o próximo sequencial
        const existing = await prisma.serviceOrder.findMany({
            where: {
                id: { startsWith: prefix }
            },
            select: { id: true }
        });

        let maxSeq = 0;
        for (const order of existing) {
            const parts = order.id.split('-');
            if (parts.length === 2 && parts[0] === String(data.contrato)) {
                const seq = parseInt(parts[1], 10);
                if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
            }
        }
        customId = `${data.contrato}-${maxSeq + 1}`;
    }

    // 2. Transação: Criar OS + Criar Pendência
    return prisma.$transaction(async (tx) => {
        const os = await tx.serviceOrder.create({
            data: {
                id: customId, // Se undefined, usa UUID v4
                description: data.descricao,
                priority: data.prioridade as Priority,
                scheduledDate: new Date(data.dataPrevista),
                clientData: {
                    nome: data.cliente.nome,
                    codigo: data.cliente.codigo,
                    documento: data.cliente.documento,
                    endereco: data.endereco,
                    contato: data.contato,
                    contrato: data.contrato
                },
                status: 'ABERTA'
            }
        });

        // Determina título de exibição
        // Se usou ID customizado, usa ele. Se não, usa o número sequencial (autoincrement)
        const displayId = customId || os.number;

        // Criação da Pendência Vinculada
        await PendenciaService.criar({
            titulo: `OS #${displayId} - ${data.cliente.nome}`,
            descricao: data.descricao || data.observacoes || 'Gerado automaticamente via OS',
            tipo: 'OS',
            status: 'PENDENTE',
            prioridade: data.prioridade,
            origemId: os.id, // Link físico via UUID (ou customId)
            origemTipo: 'OS',
            criadoPor: context.user.id,
            responsavelId: context.user.id, // Quem criou a OS é o responsável inicial? Route.ts usava session.user.id
            dataPrevisao: data.dataPrevista,
            // Tags são aceitas pela interface mas ignoradas na persistência atual do PendenciaService
            tags: [data.cliente.nome, data.contrato ? `Contrato: ${data.contrato}` : ''].filter(Boolean) as string[]
        }, context, tx);

        return mapPrismaToApp(os);
    });
  }
};
