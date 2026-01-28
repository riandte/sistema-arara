import axios from 'axios'
import type { PessoaResponse, Pessoa, InserirPessoaResponse } from './types'
import clientesPostman from './clientes_postman.json'

import { env } from '@/shared/env'
import { supabase } from '@/lib/supabase'

function cfg() {
  const base = env.LOCAPP_BASE_URL
  const cnpj = env.LOCAPP_CNPJ
  const secret = env.LOCAPP_SECRET
  return { base, cnpj, secret }
}

function headers() {
  const { cnpj, secret } = cfg()
  const h: Record<string, string> = {}
  if (cnpj) h['x-api-key'] = cnpj
  if (secret) h['x-api-secret'] = secret
  return h
}

// Helper para converter dados do Supabase para Pessoa
function mapSupabaseToPessoa(row: any): Pessoa {
  // Se a coluna 'dados' existir e tiver o JSON completo, usamos ela
  // Mas garantimos que os campos principais batam
  if (row.dados) {
    return row.dados as Pessoa;
  }
  // Fallback se a estrutura for diferente
  return {
    CpfCnpj: row.cpf_cnpj,
    Nome: row.nome,
    NomeFantasia: row.nome_fantasia,
    Email: row.email,
    Id: row.id
  } as Pessoa;
}

export async function consultarCliente(cpfcnpj: string) {
  // 1. Tentar buscar do Supabase (Prioridade)
  if (supabase) {
    try {
      // Remove caracteres não numéricos para garantir match
      const doc = cpfcnpj.replace(/\D/g, '')
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('cpf_cnpj', doc)
        .single()
      
      if (data) {
        return { sucesso: true, dados: mapSupabaseToPessoa(data) }
      }
      // Se não achar, continua para outras fontes (Legado/Mock)
    } catch (err) {
      console.warn('Erro ao consultar Supabase:', err)
    }
  }

  const { base } = cfg()
  if (!base) {
     // Fallback para mock local se configurado ou dev
     // ... (logica existente abaixo)
  } else {
    // Logica existente da API Legada
    const url = `${base.replace(/\/$/, '')}/api/Pessoa/Get?cpfcnpj=${encodeURIComponent(cpfcnpj)}`
    const resp = await axios.get<PessoaResponse>(url, { headers: headers(), timeout: 10000 })
    const ok = !!resp.data?.Sucesso && !!resp.data?.Pessoa
    return { sucesso: ok, dados: ok ? (resp.data.Pessoa as Pessoa) : undefined, mensagem: ok ? undefined : 'Cliente não encontrado' }
  }
  
  throw new Error('LOCAPP_BASE_URL ausente e cliente não encontrado no Supabase')
}

export async function pesquisarPessoas(termo: string) {
  // 1. Tentar buscar do Supabase (Prioridade)
  if (supabase) {
    try {
      const tLower = termo.toLowerCase()
      const tDoc = termo.replace(/\D/g, '')
      
      let query = supabase.from('clientes').select('*').limit(20)

      // Busca simples: se tem números, tenta cpf_cnpj, senão nome
      if (tDoc.length >= 3) {
         query = query.ilike('cpf_cnpj', `%${tDoc}%`)
      } else {
         query = query.or(`nome.ilike.%${termo}%,nome_fantasia.ilike.%${termo}%`)
      }

      const { data, error } = await query
      
      if (data && data.length > 0) {
        return { sucesso: true, dados: data.map(mapSupabaseToPessoa) }
      }
    } catch (err) {
      console.warn('Erro ao pesquisar Supabase:', err)
    }
  }

  const { base } = cfg()
  
  // Search in local mock data (ONLY IN DEV)
  const isDev = env.NODE_ENV !== 'production'
  const tLower = termo.toLowerCase()
  const localResults = isDev ? (clientesPostman as any[]).filter(p => {
    const nome = (p.Nome || '').toLowerCase()
    const fantasia = (p.NomeFantasia || '').toLowerCase()
    const doc = (p.CpfCnpj || '').replace(/\D/g, '')
    const tDoc = termo.replace(/\D/g, '')

    return nome.includes(tLower) || 
           fantasia.includes(tLower) || 
           (tDoc.length >= 3 && doc.includes(tDoc))
  }) as Pessoa[] : []

  if (!base) {
    if (!isDev) throw new Error('LOCAPP_BASE_URL ausente em produção')
    // If no API configured, return local results (dev only)
    return { sucesso: true, dados: localResults }
  }

  // Try searching by generic 'q' parameter or 'nome'/'cpfcnpj' based on input
  // Assuming the API supports a generic search or filter
  const isDoc = /^\d+$/.test(termo)
  const param = isDoc ? 'cpfcnpj' : 'nome'
  
  const url = `${base.replace(/\/$/, '')}/api/Pessoa/Get?${param}=${encodeURIComponent(termo)}`
  
  try {
    const resp = await axios.get<any>(url, { headers: headers(), timeout: 10000 })
    
    // Normalize response: API might return { Pessoa: {...} } or { Pessoas: [...] } or { Dados: [...] }
    const data = resp.data
    let lista: Pessoa[] = []
    
    if (data.Pessoas && Array.isArray(data.Pessoas)) {
      lista = data.Pessoas
    } else if (data.Pessoa && !Array.isArray(data.Pessoa)) {
      lista = [data.Pessoa]
    } else if (Array.isArray(data)) {
      lista = data
    }

    // Merge with local results, avoiding duplicates by CpfCnpj
    const seen = new Set(lista.map(p => p.CpfCnpj))
    for (const p of localResults) {
      if (!seen.has(p.CpfCnpj)) {
        lista.push(p)
        seen.add(p.CpfCnpj)
      }
    }

    return { sucesso: true, dados: lista }
  } catch (err) {
    console.error('Erro na pesquisa (API falhou, retornando local):', err)
    // If API fails, return local results
    return { sucesso: true, dados: localResults }
  }
}


export async function listarContratosPorCnpj(cpfCnpj: string) {
  const { base } = cfg()
  if (!base) throw new Error('LOCAPP_BASE_URL ausente')
  // Try filtering by CpfCnpj if the API supports it
  const url = `${base.replace(/\/$/, '')}/api/Contrato/Get?CpfCnpj=${encodeURIComponent(cpfCnpj)}`
  const resp = await axios.get(url, { headers: headers(), timeout: 10000 })
  return resp.data
}

export async function inserirOuAtualizarPessoa(pessoas: Pessoa[]) {
  const { base } = cfg()
  if (!base) throw new Error('LOCAPP_BASE_URL ausente')
  const url = `${base.replace(/\/$/, '')}/api/Pessoa/InsertOrUpdate`
  const resp = await axios.post<InserirPessoaResponse>(url, pessoas, { headers: { ...headers(), 'Content-Type': 'application/json' }, timeout: 15000 })
  return resp.data
}
