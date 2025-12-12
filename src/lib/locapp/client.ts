import axios from 'axios'
import { formatDateBR } from './utils'
import type { PessoaResponse, Pessoa, InserirPessoaResponse, TitulosPeriodoResponse, TituloPorIdResponse } from './types'

function cfg() {
  const base = process.env.LOCAPP_BASE_URL
  const cnpj = process.env.LOCAPP_CNPJ
  const secret = process.env.LOCAPP_SECRET
  return { base, cnpj, secret }
}

function headers() {
  const { cnpj, secret } = cfg()
  const h: Record<string, string> = {}
  if (cnpj) h['x-api-key'] = cnpj
  if (secret) h['x-api-secret'] = secret
  return h
}

export async function consultarCliente(cpfcnpj: string) {
  const { base } = cfg()
  if (!base) throw new Error('LOCAPP_BASE_URL ausente')
  const url = `${base.replace(/\/$/, '')}/api/Pessoa/Get?cpfcnpj=${encodeURIComponent(cpfcnpj)}`
  const resp = await axios.get<PessoaResponse>(url, { headers: headers(), timeout: 10000 })
  const ok = !!resp.data?.Sucesso && !!resp.data?.Pessoa
  return { sucesso: ok, dados: ok ? (resp.data.Pessoa as Pessoa) : undefined, mensagem: ok ? undefined : 'Cliente não encontrado' }
}

export async function listarTitulos(dataInicial: Date, dataFinal: Date) {
  const { base } = cfg()
  if (!base) throw new Error('LOCAPP_BASE_URL ausente')
  const url = `${base.replace(/\/$/, '')}/api/Titulo/Get?DataInicial=${encodeURIComponent(formatDateBR(dataInicial))}&DataFinal=${encodeURIComponent(formatDateBR(dataFinal))}`
  const resp = await axios.get<TitulosPeriodoResponse>(url, { headers: headers(), timeout: 10000 })
  return resp.data
}

export async function listarContratos(params: { numero?: string; dataInicial?: Date; dataFinal?: Date }) {
  const { base } = cfg()
  if (!base) throw new Error('LOCAPP_BASE_URL ausente')
  const baseUrl = `${base.replace(/\/$/, '')}/api/Contrato/`
  const qs: string[] = []
  if (params.numero) qs.push(`Numero=${encodeURIComponent(params.numero)}`)
  if (params.dataInicial && params.dataFinal) {
    qs.push(`DataEmissaoInicial=${encodeURIComponent(formatDateBR(params.dataInicial))}`)
    qs.push(`DataEmissaoFinal=${encodeURIComponent(formatDateBR(params.dataFinal))}`)
  }
  const url = `${baseUrl}?${qs.join('&')}`
  const resp = await axios.get(url, { headers: headers(), timeout: 10000 })
  return resp.data
}

export async function consultarTituloPorId(id: string) {
  const { base } = cfg()
  if (!base) throw new Error('LOCAPP_BASE_URL ausente')
  const url = `${base.replace(/\/$/, '')}/api/Titulo/Get/${encodeURIComponent(id)}`
  const resp = await axios.get<TituloPorIdResponse>(url, { headers: headers(), timeout: 10000 })
  return resp.data
}

export async function inserirOuAtualizarPessoa(pessoas: Pessoa[]) {
  const { base } = cfg()
  if (!base) throw new Error('LOCAPP_BASE_URL ausente')
  const url = `${base.replace(/\/$/, '')}/api/Pessoa/InsertOrUpdate`
  const resp = await axios.post<InserirPessoaResponse>(url, pessoas, { headers: { ...headers(), 'Content-Type': 'application/json' }, timeout: 15000 })
  return resp.data
}
