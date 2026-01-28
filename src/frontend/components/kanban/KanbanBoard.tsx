
"use client"

import { Pendencia, StatusPendencia } from '@/shared/types'
import { KanbanCard } from './KanbanCard'
import { AlertCircle, Clock, CheckCircle } from 'lucide-react'

interface KanbanBoardProps {
    pendencias: Pendencia[]
    onMove: (id: string, direction: 'prev' | 'next') => void
    onClick: (pendencia: Pendencia) => void
    movingId: string | null
}

export function KanbanBoard({ pendencias, onMove, onClick, movingId }: KanbanBoardProps) {
    const columns: { id: StatusPendencia; label: string; icon: any; color: string }[] = [
        { id: 'PENDENTE', label: 'A Fazer', icon: AlertCircle, color: 'text-yellow-400' },
        { id: 'EM_ANDAMENTO', label: 'Em Andamento', icon: Clock, color: 'text-blue-400' },
        { id: 'CONCLUIDO', label: 'Concluído', icon: CheckCircle, color: 'text-green-400' },
    ]

    return (
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
            {columns.map(col => {
                const items = pendencias.filter(p => p.status === col.id)
                
                return (
                    <div key={col.id} className="min-w-[320px] flex-1 flex flex-col bg-gray-900/50 border border-white/5 rounded-xl h-full">
                        {/* Column Header */}
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5 rounded-t-xl">
                            <div className="flex items-center gap-2 font-semibold text-gray-200">
                                <col.icon size={18} className={col.color} />
                                {col.label}
                            </div>
                            <span className="bg-gray-800 text-xs px-2 py-1 rounded-full text-gray-400 border border-white/5">
                                {items.length}
                            </span>
                        </div>

                        {/* Cards Container */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {items.length === 0 ? (
                                <div className="text-center py-10 text-gray-600 border-2 border-dashed border-white/5 rounded-lg">
                                    <span className="text-sm">Nenhuma pendência</span>
                                </div>
                            ) : (
                                items.map(p => (
                                    <KanbanCard 
                                        key={p.id} 
                                        pendencia={p} 
                                        onMove={onMove}
                                        onClick={onClick}
                                        isMoving={movingId === p.id}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
