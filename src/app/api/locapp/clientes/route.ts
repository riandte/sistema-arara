import { NextResponse } from 'next/server'
import { consultarCliente } from '../../../../lib/locapp/client'

function validate(req: Request) {
  const expected = process.env.API_SECRET_KEY
  if (!expected) return true
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  return token === expected
}

export async function GET(req: Request) {
  if (!validate(req)) return NextResponse.json({ sucesso: false, mensagem: 'unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const cpfcnpj = (url.searchParams.get('cpfcnpj') || '').trim()
  if (!cpfcnpj) return NextResponse.json({ sucesso: false, mensagem: 'cpfcnpj obrigatório' }, { status: 400 })
  try {
    const result = await consultarCliente(cpfcnpj)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, mensagem: 'erro interno' }, { status: 500 })
  }
}
