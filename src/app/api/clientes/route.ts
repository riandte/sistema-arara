import { NextResponse } from 'next/server'
import { consultarCliente } from '@/lib/locapp/client'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const cpfcnpj = (url.searchParams.get('cpfcnpj') || '').trim()
  
  if (!cpfcnpj) {
    return NextResponse.json({ sucesso: false, mensagem: 'CPF/CNPJ obrigatório' }, { status: 400 })
  }

  try {
    const result = await consultarCliente(cpfcnpj)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Erro ao buscar cliente:', err)
    return NextResponse.json({ sucesso: false, mensagem: 'Erro interno ao buscar cliente' }, { status: 500 })
  }
}
