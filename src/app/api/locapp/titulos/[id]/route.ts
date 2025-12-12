import { NextResponse, NextRequest } from 'next/server'
import { consultarTituloPorId } from '../../../../../lib/locapp/client'

function validate(req: Request) {
  const expected = process.env.API_SECRET_KEY
  if (!expected) return true
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  return token === expected
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!validate(req)) return NextResponse.json({ Sucesso: false, Mensagem: 'unauthorized' }, { status: 401 })
  const p = await ctx.params
  const id = (p?.id || '').trim()
  if (!id) return NextResponse.json({ Sucesso: false, Mensagem: 'id obrigatório' }, { status: 400 })
  try {
    const result = await consultarTituloPorId(id)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ Sucesso: false, Mensagem: 'erro interno' }, { status: 500 })
  }
}
