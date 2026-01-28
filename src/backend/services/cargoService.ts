import { prisma } from '@/backend/db';
import { Cargo, EscopoAtuacao } from '@/shared/types';
import { AuthContext } from '@/backend/auth/authContext';
import { assertPermission } from '@/backend/auth/permissions';

export const CargoService = {
  async listar(): Promise<Cargo[]> {
    const cargos = await prisma.position.findMany({
        where: { active: true },
        include: { sectors: true }
    });
    
    return cargos.map(c => ({
        id: c.id,
        nome: c.name,
        descricao: c.description || undefined,
        setoresPermitidos: c.sectors.map(s => s.sectorId),
        escopo: c.scope as EscopoAtuacao,
        ativo: c.active,
        createdAt: c.createdAt.toISOString()
    }));
  },
  
  async buscarPorId(id: string): Promise<Cargo | null> {
    const c = await prisma.position.findUnique({ 
        where: { id },
        include: { sectors: true }
    });
    
    if (!c) return null;
    
    return {
        id: c.id,
        nome: c.name,
        descricao: c.description || undefined,
        setoresPermitidos: c.sectors.map(s => s.sectorId),
        escopo: c.scope as EscopoAtuacao,
        ativo: c.active,
        createdAt: c.createdAt.toISOString()
    };
  },

  async criar(dados: Partial<Cargo>, context: AuthContext): Promise<Cargo> {
      await assertPermission(context, 'SISTEMA:CONFIGURAR');
      
      const novo = await prisma.position.create({
          data: {
              name: dados.nome!,
              description: dados.descricao,
              scope: dados.escopo || 'INDIVIDUAL',
              active: true,
              sectors: {
                  create: dados.setoresPermitidos?.map(sid => ({ sectorId: sid })) || []
              }
          },
          include: { sectors: true }
      });
      
      return {
          id: novo.id,
          nome: novo.name,
          descricao: novo.description || undefined,
          setoresPermitidos: novo.sectors.map(s => s.sectorId),
          escopo: novo.scope as EscopoAtuacao,
          ativo: novo.active,
          createdAt: novo.createdAt.toISOString()
      };
  },

  async atualizar(id: string, dados: Partial<Cargo>, context: AuthContext): Promise<Cargo> {
      await assertPermission(context, 'SISTEMA:CONFIGURAR');
      
      const updateData: any = {
          description: dados.descricao,
          scope: dados.escopo,
          active: dados.ativo
      };

      if (dados.nome) updateData.name = dados.nome;
      if (dados.setoresPermitidos) {
          updateData.sectors = {
              deleteMany: {},
              create: dados.setoresPermitidos.map(sid => ({ sectorId: sid }))
          };
      }

      const atualizado = await prisma.position.update({
          where: { id },
          data: updateData,
          include: { sectors: true }
      });
      
      return {
          id: atualizado.id,
          nome: atualizado.name,
          descricao: atualizado.description || undefined,
          setoresPermitidos: atualizado.sectors.map(s => s.sectorId),
          escopo: atualizado.scope as EscopoAtuacao,
          ativo: atualizado.active,
          createdAt: atualizado.createdAt.toISOString()
      };
  },

  async excluir(id: string, context: AuthContext): Promise<void> {
      await assertPermission(context, 'SISTEMA:CONFIGURAR');
      
      const emUso = await prisma.employee.findFirst({ where: { positionId: id } });
      if (emUso) throw new Error('Cargo em uso por funcionários.');
      
      await prisma.position.delete({ where: { id } });
  }
};