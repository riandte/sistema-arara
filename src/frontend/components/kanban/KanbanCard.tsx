
"use client"

import { Pendencia, StatusPendencia } from '@/shared/types'
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react'

interface KanbanCardProps {
  pendencia: Pendencia
  onMove: (id: string, direction: 'prev' | 'next') => void
  onClick: (pendencia: Pendencia) => void
  isMoving?: boolean
}

export function KanbanCard({ pendencia, onMove, onClick, isMoving }: KanbanCardProps) {
  const priorityColors = {
      'BAIXA': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      'MEDIA': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'ALTA': 'bg-red-500/20 text-red-400 border-red-500/30'
  }

  const statusFlow: StatusPendencia[] = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO'] 
  const currentIdx = statusFlow.indexOf(pendencia.status)
  
  const canMovePrev = currentIdx > 0
  const canMoveNext = currentIdx !== -1 && currentIdx < statusFlow.length - 1
  
  const handlePrint = (e: React.MouseEvent) => {
      e.stopPropagation()
      window.print() 
      alert(`Imprimindo pendência: ${pendencia.titulo}`)
  }

  return (
    <div 
        onClick={() => onClick(pendencia)}
        className="group flex bg-gray-800/40 hover:bg-gray-800 border border-white/5 hover:border-white/20 rounded-lg cursor-pointer transition-all shadow-sm hover:shadow-md relative overflow-hidden"
    >
        {/* Left Action */}
        <button
            onClick={(e) => {
                e.stopPropagation()
                if (canMovePrev) onMove(pendencia.id, 'prev')
            }}
            disabled={!canMovePrev || isMoving}
            className={`w-8 flex items-center justify-center border-r border-white/5 transition-colors
                ${canMovePrev 
                    ? 'hover:bg-white/5 text-gray-400 hover:text-white' 
                    : 'opacity-20 cursor-not-allowed text-gray-600'
                }`}
        >
            <ChevronLeft size={16} />
        </button>

        {/* Content */}
        <div className="flex-1 p-3 min-w-0">
             {/* Tags */}
             <div className="flex flex-wrap gap-2 mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${priorityColors[pendencia.prioridade] || priorityColors.MEDIA}`}>
                    {pendencia.prioridade}
                </span>
                {pendencia.origemTipo === 'OS' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        OS #{pendencia.origemId}
                    </span>
                )}
                 {pendencia.tipo === 'FINANCEIRO' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                        FINANCEIRO
                    </span>
                )}
            </div>

            <h4 className="font-medium text-sm text-gray-200 mb-1 group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                {pendencia.titulo}
            </h4>
            
            <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                {pendencia.descricao}
            </p>

            <div className="flex items-center justify-between text-[10px] text-gray-600">
                <span>
                    {new Date(pendencia.dataCriacao).toLocaleDateString('pt-BR')}
                </span>
            </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-col border-l border-white/5 w-8">
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    if (canMoveNext) onMove(pendencia.id, 'next')
                }}
                disabled={!canMoveNext || isMoving}
                className={`flex-1 flex items-center justify-center border-b border-white/5 transition-colors
                    ${canMoveNext 
                        ? 'hover:bg-white/5 text-gray-400 hover:text-white' 
                        : 'opacity-20 cursor-not-allowed text-gray-600'
                    }`}
            >
                <ChevronRight size={16} />
            </button>
            <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center hover:bg-white/5 text-gray-400 hover:text-blue-400 transition-colors"
                title="Imprimir"
            >
                <Printer size={14} />
            </button>
        </div>
    </div>
  )
}
