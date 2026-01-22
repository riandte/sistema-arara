import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import AppShell from '@/components/AppShell'
import { prisma } from '@/lib/db'
import { UserSession } from '@/lib/auth/authContext'
import { EscopoAtuacao } from '@/lib/types'

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  
  // Default fallback user
  let user: UserSession = { 
      id: 'anonymous',
      name: 'Usuário', 
      email: '', 
      roles: [] 
  }

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY || 'default-secret-key-change-me-in-prod')
      const { payload } = await jwtVerify(token, secret)
      
      const userId = (payload.sub as string) || (payload.id as string) || 'anonymous'
      
      user = { 
        id: userId,
        name: (payload.name as string) || 'Usuário', 
        email: (payload.email as string) || '',
        roles: (payload.roles as string[]) || []
      }
      
      // Enriquecer com dados do Funcionário (Competência)
      if (userId !== 'anonymous') {
          const funcionario = await prisma.employee.findUnique({
              where: { userId },
              include: { position: true }
          });
          
          if (funcionario && funcionario.active) {
              user.funcionario = {
                  id: funcionario.id,
                  setorId: funcionario.sectorId,
                  cargoId: funcionario.positionId,
                  escopo: funcionario.position.scope as EscopoAtuacao
              };
          }
      }
      
    } catch (e) {
       // Token inválido, mas AppShell lida com isso ou middleware redireciona
       console.error("Auth Error in Layout:", e);
    }
  }

  return (
    <AppShell user={user}>
      {children}
    </AppShell>
  )
}
