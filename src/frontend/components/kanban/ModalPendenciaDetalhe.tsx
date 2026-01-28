
"use client"

import { Pendencia } from '@/shared/types'
import { X, Calendar, User, Tag, FileText, Hash, Users, CheckCircle, AlertTriangle } from 'lucide-react'

interface ModalPendenciaDetalheProps {
  pendencia: Pendencia | null
  onClose: () => void
}

export function ModalPendenciaDetalhe({ pendencia, onClose }: ModalPendenciaDetalheProps) {
  if (!pendencia) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-gray-900 border border-white/10 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
            <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Hash size={18} className="text-blue-500" />
                    Pendência #{pendencia.id.slice(0, 8)}
                </h2>
                <p className="text-sm text-gray-400">{pendencia.titulo}</p>
            </div>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
            
            {/* Status & Priority Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 p-3 rounded-lg border border-white/5">
                    <span className="text-xs text-gray-500 block mb-1">Status</span>
                    <span className="text-sm font-medium text-white">{pendencia.status.replace('_', ' ')}</span>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg border border-white/5">
                    <span className="text-xs text-gray-500 block mb-1">Prioridade</span>
                    <span className={`text-sm font-bold ${
                        pendencia.prioridade === 'ALTA' ? 'text-red-400' :
                        pendencia.prioridade === 'MEDIA' ? 'text-blue-400' : 'text-gray-400'
                    }`}>
                        {pendencia.prioridade}
                    </span>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg border border-white/5">
                    <span className="text-xs text-gray-500 block mb-1">Tipo</span>
                    <span className="text-sm text-white">{pendencia.tipo}</span>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg border border-white/5">
                    <span className="text-xs text-gray-500 block mb-1">Origem</span>
                    <span className="text-sm text-white flex items-center gap-1">
                        {pendencia.origemTipo}
                        {pendencia.origemId && <span className="text-xs bg-gray-700 px-1 rounded">{pendencia.origemId}</span>}
                    </span>
                </div>
            </div>

            {/* Description */}
            <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                    <FileText size={16} />
                    Descrição
                </h3>
                <div className="bg-gray-800/30 p-4 rounded-lg border border-white/5 text-gray-300 text-sm whitespace-pre-wrap">
                    {pendencia.descricao || "Sem descrição."}
                </div>
            </div>

            {/* Conclusão (Se houver) */}
            {(pendencia.conclusao || pendencia.tipoEncerramento) && (
                <div className="bg-gray-800/30 p-4 rounded-lg border border-white/5">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                        {pendencia.tipoEncerramento === 'CONCLUIDO' ? 
                            <CheckCircle size={16} className="text-green-500" /> : 
                            <AlertTriangle size={16} className="text-red-500" />
                        }
                        Encerramento
                    </h3>
                    {pendencia.tipoEncerramento && (
                        <div className="text-xs text-gray-500 mb-2">
                            Tipo: <span className={pendencia.tipoEncerramento === 'CONCLUIDO' ? 'text-green-400' : 'text-red-400 font-bold'}>
                                {pendencia.tipoEncerramento === 'CONCLUIDO' ? 'Concluído com Sucesso' : 'Encerrado sem Resolução'}
                            </span>
                        </div>
                    )}
                    {pendencia.conclusao && (
                        <div className="text-sm text-gray-300 whitespace-pre-wrap italic border-l-2 border-white/10 pl-3">
                            "{pendencia.conclusao}"
                        </div>
                    )}
                </div>
            )}

            {/* Meta Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Datas</h4>
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                        <Calendar size={14} className="text-gray-500" />
                        <span>Criado em: {new Date(pendencia.dataCriacao).toLocaleString('pt-BR')}</span>
                    </div>
                    {pendencia.dataPrevisao && (
                         <div className="flex items-center gap-3 text-sm text-orange-300">
                            <Calendar size={14} className="text-orange-500" />
                            <span>Previsão: {new Date(pendencia.dataPrevisao).toLocaleDateString('pt-BR')}</span>
                        </div>
                    )}
                    {pendencia.dataConclusao && (
                         <div className="flex items-center gap-3 text-sm text-green-300">
                            <Calendar size={14} className="text-green-500" />
                            <span>Concluído: {new Date(pendencia.dataConclusao).toLocaleString('pt-BR')}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Responsáveis</h4>
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                        <User size={14} className="text-gray-500" />
                        <span>Criado por: <span className="text-white">{pendencia.criadoPor}</span></span>
                    </div>
                     <div className="flex items-center gap-3 text-sm text-gray-300">
                        <User size={14} className="text-gray-500" />
                        <span>Responsável: <span className="text-white">{pendencia.responsavelId || 'Não atribuído'}</span></span>
                    </div>
                    {pendencia.setorResponsavel && (
                        <div className="flex items-center gap-3 text-sm text-gray-300">
                            <Users size={14} className="text-gray-500" />
                            <span>Setor: <span className="text-white">{pendencia.setorResponsavel}</span></span>
                        </div>
                    )}
                </div>
            </div>
             
             {/* Tags */}
             {pendencia.tags && pendencia.tags.length > 0 && (
                 <div className="pt-4 border-t border-white/5">
                    <div className="flex flex-wrap gap-2">
                        {pendencia.tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1 text-xs bg-gray-800 px-2 py-1 rounded-full text-gray-400 border border-white/5">
                                <Tag size={10} />
                                {tag}
                            </span>
                        ))}
                    </div>
                 </div>
             )}

        </div>
        
        {/* Footer */}
        <div className="p-4 bg-gray-900 border-t border-white/10 flex justify-end">
            <button 
                onClick={onClose}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
            >
                Fechar
            </button>
        </div>
      </div>
    </div>
  )
}
