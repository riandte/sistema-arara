import { Permission } from '@/shared/types';
import { AuthContext } from '@/backend/auth/authContext';
import { prisma } from '@/backend/db';

export class ForbiddenError extends Error {
  constructor(message: string = 'Acesso negado') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export async function hasPermission(context: AuthContext, requiredPermission: Permission): Promise<boolean> {
  if (!context || !context.user || !context.user.roles || context.user.roles.length === 0) return false;
  
  // Otimização: Buscar apenas as permissões das roles do usuário
  const permissions = await prisma.rolePermission.findMany({
    where: {
      roleId: {
        in: context.user.roles
      }
    },
    select: {
      permissionId: true
    }
  });
  
  const userPermissions = new Set(permissions.map(p => p.permissionId));
  
  return userPermissions.has(requiredPermission);
}

export async function assertPermission(context: AuthContext, requiredPermission: Permission): Promise<void> {
  if (!(await hasPermission(context, requiredPermission))) {
    throw new ForbiddenError(`Usuário não possui permissão: ${requiredPermission}`);
  }
}
