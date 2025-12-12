import { NextResponse } from 'next/server'
import axios from 'axios'

const store: any[] = []
let nextId = 1

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const base = process.env.LOCAPP_BASE_URL
    const path = process.env.API_SERVICE_ORDER_PATH || 'api/Pessoa/InsertOrUpdate'
    if (base) {
      const h: Record<string, string> = { 'Content-Type': 'application/json' }
      if (process.env.LOCAPP_CNPJ) h['x-api-key'] = process.env.LOCAPP_CNPJ as string
      if (process.env.LOCAPP_SECRET) h['x-api-secret'] = process.env.LOCAPP_SECRET as string
      const payload = /Pessoa\/InsertOrUpdate$/.test(path) ? [body] : body
      const resp = await axios.post(`${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`, payload, { headers: h })
      return NextResponse.json(resp.data, { status: resp.status })
    }
    const order = { id: String(nextId++), ...body, createdAt: new Date().toISOString() }
    store.push(order)
    return NextResponse.json(order, { status: 201 })
  } catch (err: any) {
    const status = err?.response?.status || 500
    const data = err?.response?.data || { error: 'Erro ao criar OS' }
    return NextResponse.json(data, { status })
  }
}
