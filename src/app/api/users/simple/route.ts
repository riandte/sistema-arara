import { NextResponse } from 'next/server';
import { getSession } from '@/backend/auth/session';
import { UserService } from '@/backend/services/userService';

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Retorna lista simplificada para comboboxes/selects
    // Qualquer usuário autenticado pode ver a lista de usuários para atribuir tarefas
    const simpleUsers = await UserService.listarSimples(session);
    
    return NextResponse.json(simpleUsers);
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
