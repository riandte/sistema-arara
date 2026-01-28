
import { useState } from 'react';
import { Pendencia, StatusPendencia } from '@/shared/types';
import { AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';

interface ModalConclusaoPendenciaProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dados: { status: StatusPendencia; conclusao?: string }) => void;
  pendencia: Pendencia;
}

export function ModalConclusaoPendencia({ isOpen, onClose, onConfirm, pendencia }: ModalConclusaoPendenciaProps) {
  const [conclusao, setConclusao] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isManual = pendencia.origemTipo === 'MANUAL';

  const handleConfirm = (status: StatusPendencia) => {
    if (isManual && !conclusao.trim()) {
      setError('A conclusão é obrigatória para pendências manuais.');
      return;
    }
    onConfirm({ status, conclusao: isManual ? conclusao : undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            {isManual ? <CheckCircle className="text-blue-400" size={20} /> : <AlertTriangle className="text-yellow-400" size={20} />}
            {isManual ? 'Encerrar Chamado' : 'Confirmar Conclusão'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {isManual ? (
            <>
              <p className="text-gray-300 text-sm">
                Para encerrar este chamado, descreva a solução aplicada ou o motivo do encerramento.
              </p>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Conclusão / Resolução <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={conclusao}
                  onChange={(e) => {
                    setConclusao(e.target.value);
                    setError('');
                  }}
                  placeholder="Ex: Problema resolvido com atualização de cadastro..."
                  className="w-full h-32 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none transition-all"
                  autoFocus
                />
                {error && <span className="text-red-400 text-xs mt-1 block">{error}</span>}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-200 text-lg font-medium mb-2">Esta tarefa está realmente concluída?</p>
              <p className="text-gray-400 text-sm">
                A pendência será marcada como concluída e não poderá ser reaberta facilmente.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 bg-gray-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          
          {isManual ? (
            <>
               <button
                onClick={() => handleConfirm('ENCERRADA_SEM_CONCLUSAO')}
                className="px-4 py-2 text-sm font-medium text-red-300 hover:text-white hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-all"
              >
                Encerrar sem Resolução
              </button>
              <button
                onClick={() => handleConfirm('CONCLUIDO')}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-600/20 transition-all"
              >
                Concluir Chamado
              </button>
            </>
          ) : (
            <button
              onClick={() => handleConfirm('CONCLUIDO')}
              className="px-6 py-2 text-sm font-medium bg-green-600 hover:bg-green-500 text-white rounded-lg shadow-lg shadow-green-600/20 transition-all"
            >
              Confirmar
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
