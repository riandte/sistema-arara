"use client"
import { useState, useEffect, useRef } from 'react'
import { Search, Loader2, User } from 'lucide-react'

export default function InputCliente({ onData }: { onData: (data: any) => void }) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = setTimeout(() => {
      if (value.length >= 3) {
        buscar(value)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 500)

    return () => clearTimeout(handler)
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [wrapperRef])

  async function buscar(termo: string) {
    setLoading(true)
    try {
      const r = await fetch(`/api/clientes/search?q=${encodeURIComponent(termo)}`)
      const j = await r.json()
      if (r.ok && j.sucesso) {
        setSuggestions(j.dados || [])
        setShowSuggestions(true)
      }
    } catch {
       // Silent fail
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(cliente: any) {
    setValue(cliente.Nome)
    onData(cliente)
    setShowSuggestions(false)
  }

  return (
    <div className="grid gap-2 relative" ref={wrapperRef}>
      <label className="text-sm font-medium text-gray-300">Buscar Cliente (Nome, CPF ou CNPJ)</label>
      <div className="relative">
        <input 
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
            value={value} 
            onChange={e => setValue(e.target.value)} 
            onFocus={() => value.length >= 3 && setShowSuggestions(true)}
            placeholder="Digite para buscar..." 
            autoComplete="off"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/10 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
            {suggestions.map((cliente, i) => (
                <button 
                    key={i}
                    type="button"
                    onClick={() => handleSelect(cliente)}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors border-b border-white/5 last:border-0 group"
                >
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 flex items-center justify-center text-blue-400 transition-colors shrink-0">
                        <User size={14} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-200">{cliente.Nome}</p>
                        <p className="text-xs text-gray-500">{cliente.CpfCnpj || 'Documento não informado'} • {cliente.Enderecos?.[0]?.Cidade || 'Sem endereço'}</p>
                    </div>
                </button>
            ))}
        </div>
      )}
      
      {showSuggestions && suggestions.length === 0 && !loading && value.length >= 3 && (
         <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/10 rounded-xl shadow-xl z-50 p-4 text-center text-sm text-gray-500">
            Nenhum cliente encontrado.
         </div>
      )}
    </div>
  )
}
