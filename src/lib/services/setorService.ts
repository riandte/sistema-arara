import { prisma } from '@/lib/db';
import { Setor } from '@/lib/types';
import { AuthContext } from '@/lib/auth/authContext';
import { assertPermission } from '@/lib/auth/permissions';

export const SetorService = {
  async listar(): Promise<Setor[]> {
    const setores = await prisma.sector.findMany({
        where: { active: true }
    });
    return setores.map(s => ({
        id: s.id,
        nome: s.name,
        descricao: s.description || undefined,
        ativo: s.active,
        createdAt: s.createdAt.toISOString()
    }));
  },

  async buscarPorId(id: string): Promise<Setor | null> {
    const s = await prisma.sector.findUnique({ where: { id } });
    if (!s) return null;
    return {
        id: s.id,
        nome: s.name,
        descricao: s.description || undefined,
        ativo: s.active,
        createdAt: s.createdAt.toISOString()
    };
  },

  async criar(dados: Partial<Setor>, context: AuthContext): Promise<Setor> {
      await assertPermission(context, 'SISTEMA:CONFIGURAR');
      
      const novo = await prisma.sector.create({
          data: {
              name: dados.nome!,
              description: dados.descricao,
              active: true
          }
      });
      
      return {
          id: novo.id,
          nome: novo.name,
          descricao: novo.description || undefined,
          ativo: novo.active,
          createdAt: novo.createdAt.toISOString()
      };
  },
  
  async atualizar(id: string, dados: Partial<Setor>, context: AuthContext): Promise<Setor> {
      await assertPermission(context, 'SISTEMA:CONFIGURAR');
      
      const atualizado = await prisma.sector.update({
          where: { id },
          data: {
              name: dados.nome,
              description: dados.descricao,
              active: dados.ativo
          }
      });
      
      return {
          id: atualizado.id,
          nome: atualizado.name,
          descricao: atualizado.description || undefined,
          ativo: atualizado.active,
          createdAt: atualizado.createdAt.toISOString()
      };
  },

  async excluir(id: string, context: AuthContext): Promise<void> {
      await assertPermission(context, 'SISTEMA:CONFIGURAR');
      
      // Validar se tem uso
      const emUso = await prisma.employee.findFirst({ where: { sectorId: id } });
      if (emUso) throw new Error('Setor em uso por funcionários.');

      const emUsoPendencia = await prisma.pendency.findFirst({ where: { responsibleSectorId: id } });
      if (emUsoPendencia) throw new Error('Setor em uso por pendências.');
      
      await prisma.sector.delete({ where: { id } });
  }
};