import { NextResponse } from 'next/server'
import { listarContratos } from '../../../../lib/locapp/client'

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
  const numero = (url.searchParams.get('Numero') || '').trim()
  const di = (url.searchParams.get('DataEmissaoInicial') || '').trim()
  const df = (url.searchParams.get('DataEmissaoFinal') || '').trim()
  if (!numero && (!di || !df)) return NextResponse.json({ Sucesso: false, Mensagem: 'Informe Numero ou DataEmissaoInicial/Final' }, { status: 400 })
  const params: any = {}
  if (numero) params.numero = numero
  if (di && df) {
    const d1 = parseBRDate(di)
    const d2 = parseBRDate(df)
    if (!d1 || !d2) return NextResponse.json({ Sucesso: false, Mensagem: 'Datas devem estar em dd/MM/yyyy' }, { status: 400 })
    params.dataInicial = d1
    params.dataFinal = d2
  }
  try {
    const result = await listarContratos(params)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ Sucesso: false, Mensagem: 'erro interno' }, { status: 500 })
  }
}
