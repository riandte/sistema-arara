import { randomUUID } from 'crypto';
import { User, AuthContext } from '@/backend/auth/authContext';
import { assertPermission, ForbiddenError } from '@/backend/auth/permissions';
import { DEFAULT_SYSTEM_CONFIG } from '@/backend/config/systemConfig';
import { DEFAULT_USER_PARAMETERS, UserParameters } from '@/backend/config/systemParameters';
import { prisma } from '@/backend/db';
import { SystemConfig } from '@/backend/config/systemConfig';
import { env } from '@/shared/env';

// Helper to map Prisma User to App User
async function mapPrismaUserToAppUser(prismaUser: any, globalConfig: SystemConfig): Promise<User> {
  return {
    id: prismaUser.id,
    name: prismaUser.name,
    email: prismaUser.email,
    password: prismaUser.passwordHash, // Mapping hash to password field for compatibility
    roles: prismaUser.roles.map((r: any) => r.roleId),
    active: prismaUser.active,
    configuracoes: globalConfig, // Using global config as user config for now (migration strategy)
    parametros: (prismaUser.parameters as UserParameters) || DEFAULT_USER_PARAMETERS,
    createdAt: prismaUser.createdAt.toISOString(),
    updatedAt: prismaUser.updatedAt.toISOString()
  };
}

// Helper to get Global Config
async function getSystemConfig(): Promise<SystemConfig> {
  const config = await prisma.systemConfig.findUnique({ where: { id: 1 } });
  return (config?.config as unknown as SystemConfig) || DEFAULT_SYSTEM_CONFIG;
}

import { hashPassword } from '@/backend/auth/password';

export const UserService = {
  async listar(context: AuthContext): Promise<User[]> {
    // Apenas quem pode gerenciar usuários vê a lista completa
    await assertPermission(context, 'USUARIO:GERENCIAR');
    
    const users = await prisma.user.findMany({
      include: { roles: true }
    });

    const globalConfig = await getSystemConfig();
    return Promise.all(users.map(u => mapPrismaUserToAppUser(u, globalConfig)));
  },

  async listarSimples(context: AuthContext): Promise<Pick<User, 'id' | 'name' | 'email' | 'roles'>[]> {
    // Permite que qualquer usuário autenticado veja a lista para atribuições (comboboxes)
    if (!context.user) throw new ForbiddenError('Não autenticado');

    const users = await prisma.user.findMany({
        where: { active: true },
        select: {
            id: true,
            name: true,
            email: true,
            roles: { select: { roleId: true } }
        }
    });

    return users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        roles: u.roles.map(r => r.roleId as any)
    }));
  },

  async buscarPorId(id: string, context: AuthContext): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { roles: true }
    });
    
    if (!user) return null;

    // Permite ver a si mesmo OU se tiver permissão de gerenciar
    const isSelf = context.user.id === id;
    const canManage = context.user.roles.includes('ADMIN');

    if (!isSelf && !canManage) {
       throw new ForbiddenError('Acesso negado aos dados deste usuário.');
    }
    
    const globalConfig = await getSystemConfig();
    return mapPrismaUserToAppUser(user, globalConfig);
  },

  // Internal use (Login) - No AuthContext check
  async buscarPorEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { roles: true }
    });

    if (!user) return null;
    const globalConfig = await getSystemConfig();
    return mapPrismaUserToAppUser(user, globalConfig);
  },

  async criar(dados: Pick<User, 'name' | 'email' | 'password' | 'roles'>, context: AuthContext): Promise<User> {
    await assertPermission(context, 'USUARIO:GERENCIAR');
    
    // Regra Crítica: Apenas ADMIN pode criar outro ADMIN
    if (dados.roles.includes('ADMIN')) {
        const requestorIsAdmin = context.user.roles.includes('ADMIN');
        if (!requestorIsAdmin) {
             throw new ForbiddenError('Apenas administradores podem criar novos administradores.');
        }
    }

    // Validar email único
    const existing = await prisma.user.findUnique({ where: { email: dados.email } });
    if (existing) {
        throw new Error('Email já cadastrado.');
    }

    if (!dados.password) {
        throw new Error('Senha é obrigatória para criação de usuário.');
    }

    const passwordHash = await hashPassword(dados.password);

    // Transaction to create User and Roles
    const newUser = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: dados.name,
          email: dados.email,
          passwordHash: passwordHash,
          active: true,
          parameters: DEFAULT_USER_PARAMETERS as any,
          roles: {
            create: dados.roles.map(roleId => ({ roleId }))
          }
        },
        include: { roles: true }
      });
      return created;
    });
    
    const globalConfig = await getSystemConfig();
    return mapPrismaUserToAppUser(newUser, globalConfig);
  },

  async atualizar(id: string, dados: Partial<User>, context: AuthContext): Promise<User> {
      const user = await prisma.user.findUnique({
        where: { id },
        include: { roles: true }
      });

      if (!user) throw new Error('Usuário não encontrado.');

      const isSelf = context.user.id === id;
      const isAdmin = context.user.roles.includes('ADMIN');

      // Regras de Alteração
      if (!isSelf && !isAdmin) {
          throw new ForbiddenError('Você não tem permissão para alterar este usuário.');
      }

      // Se for o próprio usuário (não admin), só pode alterar parâmetros pessoais
      if (isSelf && !isAdmin) {
          // Bloqueia alteração de campos sensíveis
          if (dados.roles || dados.active !== undefined || dados.configuracoes || dados.email) {
              throw new ForbiddenError('Você não pode alterar suas permissões, status ou configurações globais.');
          }
      }

      // Regra Crítica: Apenas ADMIN promove/rebaixa ADMIN
      if (dados.roles) {
          const currentRoles = user.roles.map(r => r.roleId);
          const targetIsAdmin = currentRoles.includes('ADMIN');
          const newRolesIsAdmin = dados.roles.includes('ADMIN');

          // Se está tentando dar Admin ou tirar Admin
          if ((!targetIsAdmin && newRolesIsAdmin) || (targetIsAdmin && !newRolesIsAdmin)) {
              if (!isAdmin) {
                  throw new ForbiddenError('Apenas administradores podem gerenciar o papel de ADMIN.');
              }
          }
      }

      // Regra: Admin desativar o último ADMIN
      if (dados.active === false) {
          const currentRoles = user.roles.map(r => r.roleId);
          if (currentRoles.includes('ADMIN')) {
               const activeAdminsCount = await prisma.user.count({
                 where: {
                   active: true,
                   roles: { some: { roleId: 'ADMIN' } },
                   id: { not: id }
                 }
               });
               
               if (activeAdminsCount === 0) {
                   throw new Error('Não é possível desativar o último administrador do sistema.');
               }
          }
          // Admin remover a si mesmo (inativar a si mesmo)
          if (context.user.id === id) {
               throw new ForbiddenError('Você não pode desativar sua própria conta.');
          }
      }

      // Regra: Configurações Globais apenas ADMIN
      if (dados.configuracoes && !isAdmin) {
          throw new ForbiddenError('Apenas administradores podem alterar configurações globais.');
      }

      const updateData: any = {};
      if (dados.name) updateData.name = dados.name;
      if (dados.email) updateData.email = dados.email;
      if (dados.active !== undefined) updateData.active = dados.active;
      if (dados.parametros) updateData.parameters = dados.parametros;
      if (dados.password) updateData.passwordHash = await hashPassword(dados.password);
      
      // Update User
      const updatedUser = await prisma.$transaction(async (tx) => {
          // 1. Atualiza dados básicos
          const updated = await tx.user.update({
              where: { id },
              data: updateData,
              include: { roles: true }
          });

          // 2. Atualiza Roles se fornecidas
          if (dados.roles) {
              // Remove todas e readiciona (estratégia simples)
              // Em produção idealmente faria diff, mas aqui garante consistência
              await tx.userRole.deleteMany({ where: { userId: id } });
              await tx.userRole.createMany({
                  data: dados.roles.map(roleId => ({
                      userId: id,
                      roleId
                  }))
              });
          }
          
          return await tx.user.findUnique({ where: { id }, include: { roles: true } });
      });

      if (!updatedUser) throw new Error('Erro ao atualizar usuário.');

      const globalConfig = await getSystemConfig();
      return mapPrismaUserToAppUser(updatedUser, globalConfig);
  },

  async excluir(id: string, context: AuthContext): Promise<void> {
      await assertPermission(context, 'USUARIO:GERENCIAR');
      
      const user = await prisma.user.findUnique({
        where: { id },
        include: { roles: true }
      });

      if (!user) throw new Error('Usuário não encontrado.');
      
      if (context.user.id === id) {
           throw new ForbiddenError('Você não pode excluir sua própria conta.');
      }
      
      const userRoles = user.roles.map(r => r.roleId);
      if (userRoles.includes('ADMIN')) {
           const activeAdminsCount = await prisma.user.count({
             where: {
               active: true,
               roles: { some: { roleId: 'ADMIN' } },
               id: { not: id }
             }
           });

           if (activeAdminsCount === 0) {
               throw new Error('Não é possível excluir o último administrador do sistema.');
           }
      }
      
      await prisma.user.delete({ where: { id } });
  }
};
