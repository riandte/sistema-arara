import { NextResponse } from 'next/server';
import { PendenciaService } from '@/backend/services/pendenciaService';
import { getSession } from '@/backend/auth/session';

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filters = {
    status: searchParams.get('status') || undefined,
    tipo: searchParams.get('tipo') || undefined,
    responsavelId: searchParams.get('responsavelId') || undefined,
    setorResponsavel: searchParams.get('setorResponsavel') || undefined,
    criadoPor: searchParams.get('criadoPor') || undefined,
    dataInicio: searchParams.get('dataInicio') || undefined,
    dataFim: searchParams.get('dataFim') || undefined,
    termo: searchParams.get('termo') || undefined,
  };

  try {
    const pendencias = await PendenciaService.listar(session, filters);
    
    // Generate CSV
    const headers = ['ID', 'Titulo', 'Tipo', 'Status', 'Setor', 'Responsavel ID', 'Prioridade', 'Data Criacao', 'Data Conclusao', 'Conclusao', 'Tipo Encerramento', 'Descricao', 'Origem'];
    const rows = pendencias.map(p => [
      p.id,
      `"${p.titulo.replace(/"/g, '""')}"`,
      p.tipo,
      p.status,
      p.setorResponsavel || '',
      p.responsavelId || '',
      p.prioridade,
      p.dataCriacao,
      p.dataConclusao || '',
      `"${(p.conclusao || '').replace(/"/g, '""')}"`,
      p.tipoEncerramento || '',
      `"${(p.descricao || '').replace(/"/g, '""')}"`,
      p.origemId ? `${p.origemTipo}:${p.origemId}` : p.origemTipo
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="pendencias-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error: any) {
     return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
