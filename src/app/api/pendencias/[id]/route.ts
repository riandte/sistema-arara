
import { NextResponse } from 'next/server';
import { PendenciaService } from '@/backend/services/pendenciaService';
import { getSession } from '@/backend/auth/session';
import { ForbiddenError } from '@/backend/auth/permissions';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    
    const pendencia = await PendenciaService.atualizar(id, body, session);
    
    if (!pendencia) {
      return NextResponse.json({ error: 'Pendência não encontrada' }, { status: 404 });
    }

    return NextResponse.json(pendencia);
  } catch (error: any) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Erro ao atualizar pendência:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
