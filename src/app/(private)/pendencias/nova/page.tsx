"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { TipoPendencia, PrioridadePendencia, SetorResponsavel } from '@/shared/types'

export default function NovaPendenciaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [funcionarios, setFuncionarios] = useState<{id: string, nome: string, usuarioId?: string, cargoNome: string, setorId?: string}[]>([])
  const [setores, setSetores] = useState<{id: string, nome: string}[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/funcionarios/list').then(res => res.json()),
      fetch('/api/admin/setores').then(res => res.json())
    ])
      .then(([funcsData, setoresData]) => {
        if (Array.isArray(funcsData)) setFuncionarios(funcsData)
        if (Array.isArray(setoresData)) setSetores(setoresData)
      })
      .catch(err => console.error('Erro ao buscar dados:', err));
  }, []);

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: 'OUTRO' as TipoPendencia,
    prioridade: 'MEDIA' as PrioridadePendencia,
    dataPrevisao: '',
    setorResponsavel: '' as SetorResponsavel | '',
    responsavelId: ''
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validação de Atribuição
    if (!formData.setorResponsavel && !formData.responsavelId) {
        setError('É obrigatório atribuir a pendência a um Setor ou a uma Pessoa.')
        setLoading(false)
        window.scrollTo(0, 0)
        return
    }

    try {
      // Limpa campos vazios para não enviar string vazia
      const payload = {
        ...formData,
        setorResponsavel: formData.setorResponsavel || undefined,
        responsavelId: formData.responsavelId || undefined,
        origemTipo: 'MANUAL' // Força origem manual
      }

      const res = await fetch('/api/pendencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao criar pendência')
      }

      router.push('/pendencias')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      window.scrollTo(0, 0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-8">
        <Link 
          href="/pendencias" 
          className="inline-flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar para Pendências
        </Link>
        <h1 className="text-3xl font-bold text-white">Nova Pendência</h1>
        <p className="text-gray-400 mt-2">Crie uma nova tarefa ou solicitação para a equipe.</p>
      </div>

      <div className="bg-gray-800/50 border border-white/5 rounded-xl p-6 md:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <label htmlFor="titulo" className="block text-sm font-medium text-gray-300">
              Título da Pendência <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="titulo"
              required
              value={formData.titulo}
              onChange={e => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="Ex: Comprar material de escritório"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo */}
            <div className="space-y-2">
              <label htmlFor="tipo" className="block text-sm font-medium text-gray-300">
                Tipo
              </label>
              <select
                id="tipo"
                value={formData.tipo}
                onChange={e => setFormData({ ...formData, tipo: e.target.value as TipoPendencia })}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
              >
                <option value="OUTRO" className="bg-gray-800">Outro</option>
                <option value="ADMINISTRATIVO" className="bg-gray-800">Administrativo</option>
                <option value="FINANCEIRO" className="bg-gray-800">Financeiro</option>
                <option value="TI" className="bg-gray-800">TI</option>
                <option value="COMERCIAL" className="bg-gray-800">Comercial</option>
                {/* OS removido propositalmente para não confundir com o fluxo de Nova OS */}
              </select>
              <p className="text-xs text-gray-500">
                Para Ordem de Serviço, utilize o menu <Link href="/os/nova" className="text-blue-400 hover:underline">Nova OS</Link>.
              </p>
            </div>

            {/* Prioridade */}
            <div className="space-y-2">
              <label htmlFor="prioridade" className="block text-sm font-medium text-gray-300">
                Prioridade
              </label>
              <select
                id="prioridade"
                value={formData.prioridade}
                onChange={e => setFormData({ ...formData, prioridade: e.target.value as PrioridadePendencia })}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
              >
                <option value="BAIXA" className="bg-gray-800">Baixa</option>
                <option value="MEDIA" className="bg-gray-800">Média</option>
                <option value="ALTA" className="bg-gray-800">Alta</option>
              </select>
            </div>
          </div>

          {/* Atribuição */}
          <div className="bg-white/5 p-4 rounded-lg border border-white/5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-300 border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
                    <AlertCircle size={16} className="text-blue-400" />
                    Atribuição <span className="text-xs font-normal text-gray-500 ml-auto">(Selecione ao menos um)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Setor */}
                    <div className="space-y-2">
                        <label htmlFor="setor" className="block text-sm font-medium text-gray-300">
                            Setor Responsável
                        </label>
                        <select
                            id="setor"
                            value={formData.setorResponsavel}
                            onChange={e => setFormData({ 
                                ...formData, 
                                setorResponsavel: e.target.value as SetorResponsavel,
                                responsavelId: '' // Limpa o responsável ao mudar o setor
                            })}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                        >
                            <option value="" className="bg-gray-800">Selecione um setor...</option>
                            {setores.map(s => (
                                <option key={s.id} value={s.id} className="bg-gray-800">
                                    {s.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Responsável */}
                    <div className="space-y-2">
                        <label htmlFor="responsavel" className="block text-sm font-medium text-gray-300">
                            Responsável (Opcional)
                        </label>
                        <select
                            id="responsavel"
                            value={formData.responsavelId}
                            onChange={e => setFormData({ ...formData, responsavelId: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                        >
                            <option value="" className="bg-gray-800">Selecione um responsável...</option>
                            {funcionarios
                                .filter(f => !formData.setorResponsavel || f.setorId === formData.setorResponsavel)
                                .map(f => (
                                <option key={f.id} value={f.usuarioId || ''} className="bg-gray-800">
                                    {f.nome} - {f.cargoNome}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500">
                            Se não selecionado, a pendência ficará no backlog do setor ou geral.
                        </p>
                    </div>
                </div>
            </div>

          {/* Data Previsão */}
          <div className="space-y-2">
            <label htmlFor="dataPrevisao" className="block text-sm font-medium text-gray-300">
              Previsão de Conclusão (Opcional)
            </label>
            <input
              type="date"
              id="dataPrevisao"
              value={formData.dataPrevisao}
              onChange={e => setFormData({ ...formData, dataPrevisao: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all scheme-dark"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label htmlFor="descricao" className="block text-sm font-medium text-gray-300">
              Descrição Detalhada
            </label>
            <textarea
              id="descricao"
              rows={4}
              value={formData.descricao}
              onChange={e => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
              placeholder="Descreva os detalhes da solicitação..."
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-4">
            <Link
              href="/pendencias"
              className="px-6 py-3 text-gray-300 hover:text-white font-medium transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                'Salvando...'
              ) : (
                <>
                  <Save size={18} />
                  Criar Pendência
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
