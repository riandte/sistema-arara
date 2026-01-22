import { NextResponse } from 'next/server'
import { ServiceOrderService } from '@/lib/services/serviceOrderService'
import { OrdemServicoInput, PrioridadePendencia } from '@/lib/types'
import { AuthContext } from '@/lib/auth/authContext'
import { getSession } from '@/lib/auth/session'

function getSystemSession(req: Request): AuthContext | null {
  const expected = process.env.API_SECRET_KEY;
  // Se não houver chave configurada, não permite acesso de sistema por segurança
  if (!expected) return null; 
  
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  
  if (token === expected) {
      return {
          user: {
              id: 'system-integration',
              name: 'Sistema Integrado',
              email: 'system@locapp.com',
              roles: ['SISTEMA']
          }
      };
  }
  return null;
}

export async function GET(req: Request) {
  let session = await getSession(req);
  if (!session) {
    session = getSystemSession(req);
  }

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
      const orders = await ServiceOrderService.list(session);
      return NextResponse.json(orders);
  } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes('Acesso negado') ? 403 : 500 });
  }
}

export async function POST(req: Request) {
  // 1. Resolve Autenticação (Usuário ou Sistema)
  let session = await getSession(req);
  if (!session) {
    session = getSystemSession(req);
  }

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Normalizar prioridade
    let prio: PrioridadePendencia = 'MEDIA';
    if (body.prioridade === 'alta' || body.prioridade === 'ALTA') prio = 'ALTA';
    if (body.prioridade === 'baixa' || body.prioridade === 'BAIXA') prio = 'BAIXA';

    const input: OrdemServicoInput = {
        cliente: {
            codigo: body.Codigo || 0,
            nome: body.Nome || 'Cliente Sem Nome',
            documento: body.Documento || ''
        },
        contrato: body.Contrato,
        endereco: body.Endereco || '',
        contato: body.Contato || '',
        prioridade: prio,
        dataPrevista: body.dataPrevista || new Date().toISOString(),
        descricao: body.Descricao || '',
        observacoes: body.Observacoes
    };

    const order = await ServiceOrderService.create(input, session);
    return NextResponse.json(order);

  } catch (error: any) {
    console.error('Erro ao criar OS:', error);
    return NextResponse.json({ error: error.message || 'Erro interno ao criar OS' }, { status: 500 });
  }
}
