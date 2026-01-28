import { NextResponse } from 'next/server'
import { listarContratosPorCnpj } from '../../../../backend/locapp/client'
import { Contrato } from '../../../../backend/locapp/types'

function validate(req: Request) {
  const expected = process.env.API_SECRET_KEY
  if (!expected) return true
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  return token === expected
}

export async function GET(req: Request) {
  // if (!validate(req)) return NextResponse.json({ Sucesso: false, Mensagem: 'unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const cpfcnpj = (url.searchParams.get('cpfcnpj') || '').trim()
  
  if (cpfcnpj) {
    console.log(`[API] Buscando contratos para CNPJ: ${cpfcnpj}`)
    try {
      const raw = await listarContratosPorCnpj(cpfcnpj)
      console.log(`[API] Resposta bruta Legado:`, raw)

      let list: Contrato[] = []
      
      // Normalize response structure
      if (raw.Contrato && !Array.isArray(raw.Contrato)) {
         list = [raw.Contrato]
      } else if (raw.Contratos && Array.isArray(raw.Contratos)) {
         list = raw.Contratos
      } else if (Array.isArray(raw)) {
         list = raw as Contrato[]
      }

      // Filter active contracts
      const active = list.filter(c => !c.Status || c.Status === 'Ativo' || c.Status === 'Vigente')
      
      return NextResponse.json(active)
    } catch (err: any) {
      console.error(`[API] Erro ao buscar contratos:`, err)
      return NextResponse.json({ error: 'Erro ao buscar contratos' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Parâmetro cpfcnpj obrigatório' }, { status: 400 })
}
