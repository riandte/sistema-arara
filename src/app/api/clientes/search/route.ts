import { NextResponse } from 'next/server'
import { pesquisarPessoas } from '@/backend/locapp/client'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') || '').trim()
  
  if (!q) {
    return NextResponse.json({ sucesso: false, mensagem: 'Termo de busca obrigatório' }, { status: 400 })
  }

  // Minimum characters to trigger search to avoid hitting API too hard
  if (q.length < 3) {
    return NextResponse.json({ sucesso: true, dados: [] })
  }

  try {
    const result = await pesquisarPessoas(q)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Erro ao pesquisar clientes:', err)
    return NextResponse.json({ sucesso: false, mensagem: 'Erro interno ao buscar' }, { status: 500 })
  }
}
