
"use client"

import { Pendencia, StatusPendencia } from '@/shared/types'
import { AlertCircle, ChevronLeft, ChevronRight, Printer } from 'lucide-react'

interface PendenciasTableProps {
    pendencias: Pendencia[]
    onMove: (id: string, direction: 'prev' | 'next') => void
    onClick: (pendencia: Pendencia) => void
    movingId: string | null
}

export function PendenciasTable({ pendencias, onMove, onClick, movingId }: PendenciasTableProps) {
    const priorityColors: Record<string, string> = {
        'BAIXA': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        'MEDIA': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        'ALTA': 'bg-red-500/20 text-red-400 border-red-500/30'
    }

    const statusColors: Record<string, string> = {
        'PENDENTE': 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
        'EM_ANDAMENTO': 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
        'CONCLUIDO': 'bg-green-500/10 text-green-500 border border-green-500/20',
        'CANCELADO': 'bg-red-500/10 text-red-500 border border-red-500/20',
    }

    const statusFlow: StatusPendencia[] = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO'] 

    const handlePrint = (e: React.MouseEvent, p: Pendencia) => {
        e.stopPropagation()
        window.print()
        alert(`Imprimindo pendência: ${p.titulo}`)
    }

    return (
        <div className="bg-gray-900/50 border border-white/10 rounded-xl overflow-hidden shadow-xl h-full flex flex-col">
            <div className="overflow-auto custom-scrollbar flex-1">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-white/5 text-gray-200 font-medium uppercase text-xs sticky top-0 backdrop-blur-sm z-10">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Tipo</th>
                            <th className="px-6 py-4">Título / Descrição</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Prioridade</th>
                            <th className="px-6 py-4">Responsável</th>
                            <th className="px-6 py-4">Criado em</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {pendencias.length === 0 ? (
                             <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                    Nenhuma pendência encontrada
                                </td>
                            </tr>
                        ) : (
                            pendencias.map((p) => {
                                const currentIdx = statusFlow.indexOf(p.status)
                                const canMovePrev = currentIdx > 0
                                const canMoveNext = currentIdx !== -1 && currentIdx < statusFlow.length - 1

                                return (
                                    <tr 
                                        key={p.id} 
                                        className="hover:bg-white/5 transition-colors cursor-pointer group"
                                        onClick={() => onClick(p)}
                                    >
                                        <td className="px-6 py-4 font-medium text-white font-mono text-xs">
                                            #{p.id.slice(0, 8)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-medium text-gray-300 bg-gray-800 px-2 py-1 rounded border border-white/5">
                                                {p.tipo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-200 line-clamp-1">{p.titulo}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-[250px]">{p.descricao}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusColors[p.status] || 'text-gray-400'}`}>
                                                {p.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                             <span className={`px-2 py-1 rounded text-xs font-bold border ${priorityColors[p.prioridade] || priorityColors.MEDIA}`}>
                                                {p.prioridade}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            {p.responsavelId ? (
                                                <span className="text-gray-300">{p.responsavelId}</span>
                                            ) : p.setorResponsavel ? (
                                                <span className="text-blue-400 font-medium bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                                    {p.setorResponsavel}
                                                </span>
                                            ) : (
                                                <span className="text-gray-600 italic">Não atribuído</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {new Date(p.dataCriacao).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (canMovePrev) onMove(p.id, 'prev')
                                                    }}
                                                    disabled={!canMovePrev || movingId === p.id}
                                                    className={`p-1 rounded hover:bg-white/10 transition-colors ${!canMovePrev ? 'opacity-20 cursor-not-allowed' : 'text-gray-300 hover:text-white'}`}
                                                    title="Voltar status"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (canMoveNext) onMove(p.id, 'next')
                                                    }}
                                                    disabled={!canMoveNext || movingId === p.id}
                                                    className={`p-1 rounded hover:bg-white/10 transition-colors ${!canMoveNext ? 'opacity-20 cursor-not-allowed' : 'text-gray-300 hover:text-white'}`}
                                                    title="Avançar status"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                                <div className="w-px h-4 bg-white/10 mx-1"></div>
                                                <button
                                                    onClick={(e) => handlePrint(e, p)}
                                                    className="p-1 rounded hover:bg-white/10 text-gray-300 hover:text-blue-400 transition-colors"
                                                    title="Imprimir"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
