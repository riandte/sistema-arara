import { prisma } from '@/backend/db';
import { Funcionario } from '@/shared/types';
import { AuthContext } from '@/backend/auth/authContext';
import { assertPermission } from '@/backend/auth/permissions';

export const FuncionarioService = {
    async listar(context: AuthContext): Promise<Funcionario[]> {
        await assertPermission(context, 'USUARIO:GERENCIAR');

        const funcionarios = await prisma.employee.findMany({
            where: { active: true }
        });
        
        return funcionarios.map(f => ({
            id: f.id,
            nome: f.name,
            emailCorporativo: f.corporateEmail,
            setorId: f.sectorId,
            cargoId: f.positionId,
            usuarioId: f.userId,
            ativo: f.active,
            createdAt: f.createdAt.toISOString()
        }));
    },
    
    async buscarPorUsuarioId(userId: string): Promise<Funcionario | null> {
        const f = await prisma.employee.findUnique({
            where: { userId }
        });
        
        if (!f) return null;
        
        return {
            id: f.id,
            nome: f.name,
            emailCorporativo: f.corporateEmail,
            setorId: f.sectorId,
            cargoId: f.positionId,
            usuarioId: f.userId,
            ativo: f.active,
            createdAt: f.createdAt.toISOString()
        };
    },

    async buscarPorId(id: string): Promise<Funcionario | null> {
        const f = await prisma.employee.findUnique({
            where: { id }
        });
        
        if (!f) return null;
        
        return {
            id: f.id,
            nome: f.name,
            emailCorporativo: f.corporateEmail,
            setorId: f.sectorId,
            cargoId: f.positionId,
            usuarioId: f.userId,
            ativo: f.active,
            createdAt: f.createdAt.toISOString()
        };
    },

    async criar(dados: Partial<Funcionario>, context: AuthContext): Promise<Funcionario> {
        await assertPermission(context, 'USUARIO:GERENCIAR');
        
        // Verificar se usuário já tem funcionário
        if (dados.usuarioId) {
            const existing = await prisma.employee.findUnique({ where: { userId: dados.usuarioId } });
            if (existing) throw new Error('Este usuário já possui um funcionário vinculado.');
        }

        const novo = await prisma.employee.create({
            data: {
                name: dados.nome!,
                corporateEmail: dados.emailCorporativo!,
                sectorId: dados.setorId!,
                positionId: dados.cargoId!,
                userId: dados.usuarioId!,
                active: true
            }
        });

        return {
            id: novo.id,
            nome: novo.name,
            emailCorporativo: novo.corporateEmail,
            setorId: novo.sectorId,
            cargoId: novo.positionId,
            usuarioId: novo.userId,
            ativo: novo.active,
            createdAt: novo.createdAt.toISOString()
        };
    },

    async atualizar(id: string, dados: Partial<Funcionario>, context: AuthContext): Promise<Funcionario> {
        await assertPermission(context, 'USUARIO:GERENCIAR');

        const atualizado = await prisma.employee.update({
            where: { id },
            data: {
                name: dados.nome,
                corporateEmail: dados.emailCorporativo,
                sectorId: dados.setorId,
                positionId: dados.cargoId,
                active: dados.ativo
            }
        });

        return {
            id: atualizado.id,
            nome: atualizado.name,
            emailCorporativo: atualizado.corporateEmail,
            setorId: atualizado.sectorId,
            cargoId: atualizado.positionId,
            usuarioId: atualizado.userId,
            ativo: atualizado.active,
            createdAt: atualizado.createdAt.toISOString()
        };
    },

    async excluir(id: string, context: AuthContext): Promise<void> {
        await assertPermission(context, 'USUARIO:GERENCIAR');
        
        // Validar pendencias?
        const pendencias = await prisma.pendency.findFirst({
             where: { responsibleId: id } 
        });
        
        if (pendencias) throw new Error('Funcionário possui pendências vinculadas e não pode ser excluído.');

        await prisma.employee.delete({ where: { id } });
    }
}