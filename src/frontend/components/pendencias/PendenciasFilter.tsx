"use client"

import { useState, useEffect } from 'react'
import { Filter, X, Loader2 } from 'lucide-react'
import { PendenciaFilters } from '@/backend/services/pendenciaService'

interface PendenciasFilterProps {
  filters: PendenciaFilters
  onChange: (filters: PendenciaFilters) => void
}

interface SimpleUser {
    id: string;
    name: string;
}

interface Setor {
    id: string;
    nome: string;
}

interface Funcionario {
    id: string;
    nome: string;
    usuarioId?: string;
    cargoNome: string;
}

export function PendenciasFilter({ filters, onChange }: PendenciasFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<PendenciaFilters>(filters)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
      if (isOpen && funcionarios.length === 0) {
          setLoadingData(true)
          Promise.all([
            fetch('/api/funcionarios/list').then(res => res.json()),
            fetch('/api/admin/setores').then(res => res.json())
          ])
            .then(([funcsData, setoresData]) => {
                if (Array.isArray(funcsData)) setFuncionarios(funcsData)
                if (Array.isArray(setoresData)) setSetores(setoresData)
            })
            .catch(err => console.error('Failed to load filter data', err))
            .finally(() => setLoadingData(false))
      }
  }, [isOpen])

  const handleApply = () => {
    onChange(localFilters)
    setIsOpen(false)
  }

  const handleClear = () => {
    // Mantém apenas o termo de busca se ele for controlado externamente, mas aqui limpamos os filtros avançados
    const cleared: PendenciaFilters = {}
    setLocalFilters(cleared)
    onChange(cleared)
    setIsOpen(false)
  }

  const hasActiveFilters = Object.keys(filters).length > (filters.termo ? 1 : 0)

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-6 py-3 border rounded-xl hover:bg-white/10 transition-colors font-medium h-full whitespace-nowrap
            ${isOpen || hasActiveFilters ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-gray-300'}
        `}
      >
        <Filter size={18} />
        Filtros
        {hasActiveFilters && (
            <span className="flex h-2 w-2 rounded-full bg-blue-500 ml-1"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-gray-900 border border-white/10 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                <h3 className="font-semibold text-white">Filtros Avançados</h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">
                    <X size={16} />
                </button>
            </div>

            <div className="space-y-4">
                {/* Status */}
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                    <select 
                        value={localFilters.status || ''}
                        onChange={e => setLocalFilters({...localFilters, status: e.target.value || undefined})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-blue-500 outline-none"
                    >
                        <option value="">Todos</option>
                        <option value="PENDENTE">Pendente</option>
                        <option value="EM_ANDAMENTO">Em Andamento</option>
                        <option value="CONCLUIDO">Concluído</option>
                        <option value="ENCERRADA_SEM_CONCLUSAO">Encerrada s/ Resolução</option>
                        <option value="CANCELADO">Cancelado (Legado)</option>
                    </select>
                </div>

                {/* Tipo */}
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Tipo</label>
                    <select 
                        value={localFilters.tipo || ''}
                        onChange={e => setLocalFilters({...localFilters, tipo: e.target.value || undefined})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-blue-500 outline-none"
                    >
                        <option value="">Todos</option>
                        <option value="OS">OS</option>
                        <option value="FINANCEIRO">Financeiro</option>
                        <option value="ADMINISTRATIVO">Administrativo</option>
                        <option value="TI">TI</option>
                        <option value="COMERCIAL">Comercial</option>
                        <option value="OUTRO">Outro</option>
                    </select>
                </div>

                {/* Setor Responsável */}
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Setor Responsável</label>
                    <select 
                        value={localFilters.setorResponsavel || ''}
                        onChange={e => setLocalFilters({...localFilters, setorResponsavel: e.target.value || undefined})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-blue-500 outline-none"
                    >
                        <option value="">Todos</option>
                        {setores.map(s => (
                            <option key={s.id} value={s.id}>{s.nome}</option>
                        ))}
                    </select>
                </div>

                {/* Responsável (Pessoa) */}
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Responsável (Pessoa)</label>
                    <select 
                        value={localFilters.responsavelId || ''}
                        onChange={e => setLocalFilters({...localFilters, responsavelId: e.target.value || undefined})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-blue-500 outline-none"
                        disabled={loadingData}
                    >
                        <option value="">Todos</option>
                        {funcionarios.map(f => (
                            <option key={f.id} value={f.usuarioId || ''}>{f.nome} - {f.cargoNome}</option>
                        ))}
                    </select>
                    {loadingData && <span className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Loader2 size={10} className="animate-spin"/> Carregando dados...</span>}
                </div>

                {/* Criado Por */}
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Criado Por</label>
                    <select 
                        value={localFilters.criadoPor || ''}
                        onChange={e => setLocalFilters({...localFilters, criadoPor: e.target.value || undefined})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-blue-500 outline-none"
                        disabled={loadingData}
                    >
                        <option value="">Todos</option>
                        {funcionarios.map(f => (
                            <option key={f.id} value={f.usuarioId || ''}>{f.nome}</option>
                        ))}
                    </select>
                </div>

                {/* Datas */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">De</label>
                        <input 
                            type="date"
                            value={localFilters.dataInicio || ''}
                            onChange={e => setLocalFilters({...localFilters, dataInicio: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-gray-200 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Até</label>
                        <input 
                            type="date"
                            value={localFilters.dataFim || ''}
                            onChange={e => setLocalFilters({...localFilters, dataFim: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-gray-200 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <button 
                        onClick={handleClear}
                        className="flex-1 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        Limpar
                    </button>
                    <button 
                        onClick={handleApply}
                        className="flex-1 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-600/20"
                    >
                        Aplicar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
