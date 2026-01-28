import { NextResponse } from 'next/server';
import { PendenciaService } from '@/backend/services/pendenciaService';
import { getSession } from '@/backend/auth/session';

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filters = {
    status: searchParams.get('status') || undefined,
    tipo: searchParams.get('tipo') || undefined,
    responsavelId: searchParams.get('responsavelId') || undefined,
    criadoPor: searchParams.get('criadoPor') || undefined,
    dataInicio: searchParams.get('dataInicio') || undefined,
    dataFim: searchParams.get('dataFim') || undefined,
    termo: searchParams.get('termo') || undefined,
  };

  try {
    const pendencias = await PendenciaService.listar(session, filters);
    
    // Generate HTML for Printing (PDF)
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lista de Pendências</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #333; }
          h1 { font-size: 24px; margin-bottom: 10px; color: #2563eb; }
          .meta { font-size: 12px; color: #666; margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border-bottom: 1px solid #ddd; padding: 12px 8px; text-align: left; }
          th { background-color: #f8fafc; font-weight: bold; color: #475569; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .status { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
          .status-PENDENTE { background: #fef3c7; color: #d97706; }
          .status-EM_ANDAMENTO { background: #dbeafe; color: #2563eb; }
          .status-CONCLUIDO { background: #dcfce7; color: #16a34a; }
        </style>
      </head>
      <body>
        <h1>Lista de Pendências</h1>
        <div class="meta">
            <strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}<br>
            <strong>Solicitante:</strong> ${session.user.name || session.user.email}<br>
            <strong>Filtros:</strong> ${Object.values(filters).filter(Boolean).length > 0 ? JSON.stringify(filters) : 'Nenhum'}
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tipo</th>
              <th>Título</th>
              <th>Status</th>
              <th>Prioridade</th>
              <th>Setor</th>
              <th>Responsável</th>
              <th>Criado em</th>
            </tr>
          </thead>
          <tbody>
            ${pendencias.map(p => `
              <tr>
                <td>${p.id.substring(0,8)}</td>
                <td>${p.tipo}</td>
                <td>${p.titulo}</td>
                <td><span class="status status-${p.status}">${p.status.replace('_', ' ')}</span></td>
                <td>${p.prioridade}</td>
                <td>${p.setorResponsavel || '-'}</td>
                <td>${p.responsavelId || '-'}</td>
                <td>${new Date(p.dataCriacao).toLocaleDateString('pt-BR')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>
            window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    return new NextResponse('Erro interno', { status: 500 });
  }
}
