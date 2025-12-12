"use client"
import { useState } from 'react'
import { normalizeDoc } from '../../lib/locapp/utils'
import { Search, Loader2, AlertCircle } from 'lucide-react'

export default function InputCliente({ onData }: { onData: (data: any) => void }) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function buscar(doc: string) {
    const n = normalizeDoc(doc)
    setError('')
    if (n.length !== 11 && n.length !== 14) { setError('CPF/CNPJ inválido'); return }
    setLoading(true)
    try {
      const r = await fetch(`/api/clientes?cpfcnpj=${encodeURIComponent(n)}`)
      const j = await r.json()
      if (r.ok && j.sucesso && j.dados) onData(j.dados)
      else setError(j.mensagem || 'Cliente não encontrado')
    } catch { setError('Erro ao buscar cliente') }
    finally { setLoading(false) }
  }

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-gray-300">CPF/CNPJ</label>
      <div className="relative">
        <input 
            className={`w-full rounded-xl border bg-white/5 px-4 py-3 outline-none transition-all placeholder:text-gray-600
                ${error 
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                    : 'border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                }
            `} 
            value={value} 
            onChange={e => setValue(e.target.value)} 
            onBlur={e => buscar(e.target.value)} 
            placeholder="Digite apenas números" 
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 mt-1">
            <AlertCircle size={12} />
            {error}
        </div>
      )}
    </div>
  )
}
