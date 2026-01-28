import { NextResponse } from 'next/server';
import { getSession } from '@/backend/auth/session';
import { prisma } from '@/backend/db';

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const funcionarios = await prisma.employee.findMany({
        where: { active: true },
        include: { position: true }
    });

    const simpleList = funcionarios.map(f => ({
        id: f.id,
        nome: f.name,
        usuarioId: f.userId,
        setorId: f.sectorId,
        cargoNome: f.position.name
    }));
    
    return NextResponse.json(simpleList);
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
