import { NextResponse } from 'next/server';
import { getSession } from '@/backend/auth/session';
import { UserService } from '@/backend/services/userService';

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await UserService.buscarPorId(session.user.id, session);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Remover senha antes de retornar
    const { password, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    // Evitar alteração de campos sensíveis via endpoint de perfil
    // O UserService já tem proteções, mas reforçamos aqui que 'me' é auto-gestão
    const allowedUpdates = {
       name: body.name,
       parametros: body.parametros,
       // Admin pode tentar enviar configuracoes, UserService vai validar se pode
       configuracoes: body.configuracoes 
    };

    const updatedUser = await UserService.atualizar(session.user.id, allowedUpdates, session);
    
    const { password, ...safeUser } = updatedUser;
    return NextResponse.json(safeUser);
  } catch (error: any) {
    // Retornar 403 se for ForbiddenError do service
    if (error.name === 'ForbiddenError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
