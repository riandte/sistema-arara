import { NextResponse } from 'next/server'
import { inserirOuAtualizarPessoa } from '../../../../backend/locapp/client'

function validate(req: Request) {
  const expected = process.env.API_SECRET_KEY
  if (!expected) return true
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  return token === expected
}

export async function POST(req: Request) {
  if (!validate(req)) return NextResponse.json({ Sucesso: false, Mensagem: 'unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const payload = Array.isArray(body) ? body : [body]
    const result = await inserirOuAtualizarPessoa(payload)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ Sucesso: false, Mensagem: 'erro interno' }, { status: 500 })
  }
}
