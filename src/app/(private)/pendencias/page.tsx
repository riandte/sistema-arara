
"use client"

import { useEffect, useState, useCallback } from 'react'
import { Pendencia, StatusPendencia } from '@/shared/types'
import { Kanban, RefreshCw, Plus, LayoutGrid, List, Search } from 'lucide-react'
import Link from 'next/link'
import { KanbanBoard } from '@/frontend/components/kanban/KanbanBoard'
import { PendenciasTable } from '@/frontend/components/pendencias/PendenciasTable'
import { ModalPendenciaDetalhe } from '@/frontend/components/kanban/ModalPendenciaDetalhe'
import { PendenciasFilter } from '@/frontend/components/pendencias/PendenciasFilter'
import { ExportButton } from '@/frontend/components/pendencias/ExportButton'
import { ModalConclusaoPendencia } from '@/frontend/components/pendencias/ModalConclusaoPendencia'
import { PendenciaFilters } from '@/backend/services/pendenciaService'

type ViewMode = 'KANBAN' | 'TABLE'

export default function PendenciasPage() {
  const [pendencias, setPendencias] = useState<Pendencia[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPendencia, setSelectedPendencia] = useState<Pendencia | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('KANBAN')
  
  // Conclusão Modal State
  const [conclusaoModalOpen, setConclusaoModalOpen] = useState(false)
  const [pendenciaParaConcluir, setPendenciaParaConcluir] = useState<Pendencia | null>(null)
  
  // Filters State
  const [filters, setFilters] = useState<PendenciaFilters>({})
  const [searchTerm, setSearchTerm] = useState('')

  const loadPendencias = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.tipo) params.set('tipo', filters.tipo)
      if (filters.responsavelId) params.set('responsavelId', filters.responsavelId)
      if (filters.criadoPor) params.set('criadoPor', filters.criadoPor)
      if (filters.dataInicio) params.set('dataInicio', filters.dataInicio)
      if (filters.dataFim) params.set('dataFim', filters.dataFim)
      if (searchTerm) params.set('termo', searchTerm)

      const res = await fetch(`/api/pendencias?${params.toString()}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setPendencias(data)
      }
    } catch (err) {
      console.error('Erro ao carregar pendências', err)
    } finally {
      setLoading(false)
    }
  }, [filters, searchTerm])

  useEffect(() => {
    // Load persisted view mode
    const savedView = localStorage.getItem('pendenciasViewMode')
    if (savedView === 'TABLE') {
        setViewMode('TABLE')
    }
  }, [])

  // Debounce search and reload on filter change
  useEffect(() => {
      const timer = setTimeout(() => {
          loadPendencias()
      }, 500)
      return () => clearTimeout(timer)
  }, [loadPendencias])

  const handleViewChange = (mode: ViewMode) => {
      setViewMode(mode)
      localStorage.setItem('pendenciasViewMode', mode)
  }

  const handleConfirmConclusao = async (dados: { status: StatusPendencia; conclusao?: string }) => {
    if (!pendenciaParaConcluir) return

    const id = pendenciaParaConcluir.id
    const originalPendencias = [...pendencias]

    // Optimistic Update
    setPendencias(prev => prev.map(p => 
        p.id === id ? { ...p, status: dados.status, conclusao: dados.conclusao } : p
    ))
    
    setConclusaoModalOpen(false)
    setPendenciaParaConcluir(null)

    try {
        const res = await fetch(`/api/pendencias/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        })

        if (!res.ok) {
            const errData = await res.json()
            throw new Error(errData.error || 'Falha ao concluir pendência')
        }
        
        await loadPendencias()

    } catch (err: any) {
        console.error(err)
        setPendencias(originalPendencias)
        alert(`Erro: ${err.message}`)
    }
  }

  async function handleMovePendencia(id: string, direction: 'prev' | 'next') {
    const pendencia = pendencias.find(p => p.id === id)
    if (!pendencia) return

    const statusFlow: StatusPendencia[] = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO']
    const currentIdx = statusFlow.indexOf(pendencia.status)
    
    // Se não estiver no fluxo padrão (ex: CANCELADO), não move
    if (currentIdx === -1) return

    let nextStatus: StatusPendencia
    if (direction === 'next') {
        if (currentIdx >= statusFlow.length - 1) return
        nextStatus = statusFlow[currentIdx + 1]
    } else {
        if (currentIdx <= 0) return
        nextStatus = statusFlow[currentIdx - 1]
    }

    // Intercepta conclusão
    if (nextStatus === 'CONCLUIDO') {
        setPendenciaParaConcluir(pendencia)
        setConclusaoModalOpen(true)
        return
    }

    setMovingId(id)
    const originalPendencias = [...pendencias]
    
    // Optimistic Update
    setPendencias(prev => prev.map(p => 
        p.id === id ? { ...p, status: nextStatus } : p
    ))

    try {
        const res = await fetch(`/api/pendencias/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus })
        })

        if (!res.ok) {
            throw new Error('Falha ao mover pendência')
        }
        
    } catch (err) {
        console.error(err)
        setPendencias(originalPendencias)
        alert('Erro ao mover pendência. Tente novamente.')
    } finally {
        setMovingId(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col mb-6 gap-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Kanban className="text-blue-500" />
                    Gestão de Pendências
                </h1>
                <p className="text-gray-400 mt-1">Visualize e gerencie todas as tarefas do sistema</p>
            </div>
            
            <div className="flex items-center gap-3">
                 {/* View Toggle */}
                <div className="bg-white/5 p-1 rounded-lg border border-white/10 flex items-center gap-1">
                    <button
                        onClick={() => handleViewChange('KANBAN')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'KANBAN' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        title="Visualização Kanban"
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        onClick={() => handleViewChange('TABLE')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'TABLE' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        title="Visualização em Lista"
                    >
                        <List size={18} />
                    </button>
                </div>
            </div>
        </div>

        {/* Filters & Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar por título, descrição ou referência..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                />
            </div>
            <PendenciasFilter filters={filters} onChange={setFilters} />
            <ExportButton filters={{...filters, termo: searchTerm}} />
            
            <div className="h-full w-px bg-white/10 mx-2 hidden md:block"></div>

            <button 
                onClick={loadPendencias}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 transition-colors border border-white/10"
                title="Atualizar"
            >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link 
                href="/pendencias/nova"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20 whitespace-nowrap"
            >
                <Plus size={18} />
                Nova Pendência
            </Link>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'KANBAN' ? (
          <KanbanBoard 
            pendencias={pendencias}
            onMove={handleMovePendencia}
            onClick={setSelectedPendencia}
            movingId={movingId}
          />
      ) : (
          <PendenciasTable 
            pendencias={pendencias}
            onMove={handleMovePendencia}
            onClick={setSelectedPendencia}
            movingId={movingId}
          />
      )}

      <ModalPendenciaDetalhe 
        pendencia={selectedPendencia} 
        onClose={() => setSelectedPendencia(null)} 
      />
      
      {pendenciaParaConcluir && (
        <ModalConclusaoPendencia
            isOpen={conclusaoModalOpen}
            onClose={() => {
                setConclusaoModalOpen(false)
                setPendenciaParaConcluir(null)
            }}
            onConfirm={handleConfirmConclusao}
            pendencia={pendenciaParaConcluir}
        />
      )}
    </div>
  )
}
