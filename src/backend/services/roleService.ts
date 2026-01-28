import { Role as AppRole, RoleName, Permission } from '@/shared/types';
import { AuthContext } from '@/backend/auth/authContext';
import { ForbiddenError } from '@/backend/auth/permissions';
import { prisma } from '@/backend/db';

export const RoleService = {
  async listar(context: AuthContext): Promise<AppRole[]> {
    if (!context.user.roles.includes('ADMIN')) {
       throw new ForbiddenError('Apenas administradores podem visualizar papéis.');
    }
    
    const roles = await prisma.role.findMany({
        include: {
            _count: {
                select: { users: true }
            },
            permissions: {
                select: { permissionId: true }
            }
        }
    });

    return roles.map(r => ({
        name: r.name as RoleName,
        description: r.description || '',
        isSystem: r.isSystem,
        permissions: r.permissions.map(rp => rp.permissionId as Permission),
        userCount: r._count.users
    }));
  },

  async criar(role: AppRole, context: AuthContext): Promise<AppRole> {
    if (!context.user.roles.includes('ADMIN')) {
       throw new ForbiddenError('Apenas administradores podem criar papéis.');
    }
    
    if (!role.name) throw new Error('Nome do papel é obrigatório.');

    const existing = await prisma.role.findUnique({ where: { id: role.name } });
    if (existing) {
      throw new Error('Papel já existe.');
    }

    // Transaction to create role and permissions
    const newRole = await prisma.$transaction(async (tx) => {
        const created = await tx.role.create({
            data: {
                id: role.name,
                name: role.name,
                description: role.description,
                isSystem: false
            }
        });

        if (role.permissions && role.permissions.length > 0) {
            await tx.rolePermission.createMany({
                data: role.permissions.map(p => ({
                    roleId: created.id,
                    permissionId: p
                }))
            });
        }
        
        return created;
    });

    return {
        ...role,
        isSystem: false,
        userCount: 0
    };
  },

  async atualizar(name: string, dados: Partial<AppRole>, context: AuthContext): Promise<AppRole> {
    if (!context.user.roles.includes('ADMIN')) {
       throw new ForbiddenError('Apenas administradores podem gerenciar papéis.');
    }

    const role = await prisma.role.findUnique({ where: { id: name } });
    if (!role) throw new Error('Papel não encontrado.');

    if (role.isSystem) {
       if (dados.name && dados.name !== role.name) {
         throw new Error('Não é possível alterar o nome de papéis do sistema.');
       }
    }
    
    await prisma.$transaction(async (tx) => {
        await tx.role.update({
            where: { id: name },
            data: {
                description: dados.description
            }
        });
        
        if (dados.permissions) {
            // Replace permissions
            await tx.rolePermission.deleteMany({ where: { roleId: name } });
            await tx.rolePermission.createMany({
                data: dados.permissions.map(p => ({
                    roleId: name,
                    permissionId: p
                }))
            });
        }
    });
    
    const updated = await prisma.role.findUnique({ 
        where: { id: name },
        include: { permissions: { select: { permissionId: true } }, _count: { select: { users: true } } }
    });
    
    if (!updated) throw new Error('Erro ao recuperar papel atualizado.');

    return {
        name: updated.name as RoleName,
        description: updated.description || '',
        isSystem: updated.isSystem,
        permissions: updated.permissions.map(p => p.permissionId as Permission),
        userCount: updated._count.users
    };
  },

  async excluir(name: string, context: AuthContext): Promise<void> {
    if (!context.user.roles.includes('ADMIN')) {
       throw new ForbiddenError('Apenas administradores podem excluir papéis.');
    }

    const role = await prisma.role.findUnique({ 
        where: { id: name },
        include: { _count: { select: { users: true } } }
    });

    if (!role) throw new Error('Papel não encontrado.');

    if (role.isSystem) {
      throw new Error('Papéis do sistema não podem ser excluídos.');
    }
    
    if (role._count.users > 0) {
        throw new Error('Este papel está atribuído a um ou mais usuários e não pode ser excluído.');
    }
    
    await prisma.role.delete({ where: { id: name } });
  }
};
