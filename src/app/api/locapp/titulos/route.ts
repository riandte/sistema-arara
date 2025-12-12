import { NextResponse } from 'next/server'
import { listarTitulos } from '../../../../lib/locapp/client'

function validate(req: Request) {
  const expected = process.env.API_SECRET_KEY
  if (!expected) return true
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  return token === expected
}

function parseBRDate(s: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s)
  if (!m) return null
  const dd = Number(m[1])
  const mm = Number(m[2])
  const yyyy = Number(m[3])
  return new Date(yyyy, mm - 1, dd)
}

export async function GET(req: Request) {
  if (!validate(req)) return NextResponse.json({ Sucesso: false, Mensagem: 'unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const di = (url.searchParams.get('DataInicial') || '').trim()
  const df = (url.searchParams.get('DataFinal') || '').trim()
  if (!di || !df) return NextResponse.json({ Sucesso: false, Mensagem: 'DataInicial e DataFinal obrigatórios' }, { status: 400 })
  const d1 = parseBRDate(di)
  const d2 = parseBRDate(df)
  if (!d1 || !d2) return NextResponse.json({ Sucesso: false, Mensagem: 'Datas devem estar em dd/MM/yyyy' }, { status: 400 })
  try {
    const result = await listarTitulos(d1, d2)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ Sucesso: false, Mensagem: 'erro interno' }, { status: 500 })
  }
}
