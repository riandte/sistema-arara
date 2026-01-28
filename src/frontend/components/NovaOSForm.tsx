"use client"
import { useState, useEffect } from 'react'
import InputCliente from '@/frontend/components/form/InputCliente'
import InputEndereco from '@/frontend/components/form/InputEndereco'
import SelectPrioridade from '@/frontend/components/form/SelectPrioridade'
import TextAreaServico from '@/frontend/components/form/TextAreaServico'
import { Contrato } from '@/backend/locapp/types'

import Link from 'next/link'
import { ArrowLeft, Save, Calendar, User, Phone, Mail, FileText, CheckCircle, X, Printer, Edit, FileDigit, Briefcase } from 'lucide-react'

export default function NovaOSForm({ user }: { user: any }) {
  const [nome, setNome] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [endereco, setEndereco] = useState('')
  const [prioridade, setPrioridade] = useState('media')
  const [dataPrevista, setDataPrevista] = useState('')
  const [servico, setServico] = useState('')
  const [obs, setObs] = useState('')
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null })
  
  const [contracts, setContracts] = useState<Contrato[]>([])
  const [selectedContract, setSelectedContract] = useState('')
  const [loadingContracts, setLoadingContracts] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [createdOS, setCreatedOS] = useState<any>(null)

  useEffect(() => {
    const cleanCnpj = cnpj.replace(/\D/g, '')
    if (cleanCnpj.length >= 11) {
      setLoadingContracts(true)
      fetch(`/api/locapp/contratos?cpfcnpj=${encodeURIComponent(cleanCnpj)}`)
        .then(res => res.json())
        .then((data: Contrato[]) => {
          setContracts(data)
          if (data.length === 1) setSelectedContract(String(data[0].Numero))
        })
        .catch(err => {
            console.error(err)
            setContracts([])
        })
        .finally(() => setLoadingContracts(false))
    } else {
      setContracts([])
      setSelectedContract('')
      setLoadingContracts(false)
    }
  }, [cnpj])

  function onClienteData(d: any) {
    setNome(d.Nome || '')
    setCnpj(d.CpfCnpj || '')
    setTelefone(d.Contatos?.[0]?.Telefone || '')
    setEmail(d.Email || d.Contatos?.[0]?.Email || '')
    const e = d.Enderecos?.[0]
    if (e) setEndereco(`${e.Logradouro}, ${e.Numero} - ${e.Bairro} - ${e.Cidade}/${e.UF} - ${e.CEP}`)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg({ text: 'Enviando...', type: null })
    const payload = { 
        Nome: nome, 
        CpfCnpj: cnpj, 
        Telefone: telefone, 
        Email: email, 
        Endereco: endereco, 
        prioridade, 
        dataPrevista, 
        Observacoes: obs, 
        Descricao: servico,
        Contrato: selectedContract 
    }
    try {
      const r = await fetch('/api/service-orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await r.json()
      if (!r.ok) { setMsg({ text: j.error || 'Falha ao criar OS', type: 'error' }); return }
      // Merge payload with response to ensure we have all data for display even if API returns minimal info
      setCreatedOS({ ...payload, ...j })
      setShowModal(true)
      setMsg({ text: `OS criada com sucesso`, type: 'success' })
    } catch { setMsg({ text: 'Erro de rede ao enviar OS', type: 'error' }) }
  }

  function handlePrint() {
    if (!createdOS) return
    const win = window.open('', '', 'width=800,height=600')
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>Ordem de Serviço #${createdOS.id || 'Nova'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            h1 { color: #2563eb; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            .header { margin-bottom: 30px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; font-size: 0.9em; color: #666; display: block; margin-bottom: 4px; }
            .value { font-size: 1.1em; }
            .full { grid-column: 1 / -1; }
            .footer { margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; text-align: center; font-size: 0.9em; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Ordem de Serviço ${createdOS.id ? '#' + createdOS.id : ''}</h1>
            <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          
          <div class="grid">
            <div class="field">
               <span class="label">Cliente</span>
               <div class="value">${createdOS.Nome || nome}</div>
            </div>
            <div class="field">
               <span class="label">CPF/CNPJ</span>
               <div class="value">${createdOS.CpfCnpj || cnpj || '-'}</div>
            </div>
            ${createdOS.Contrato ? `
            <div class="field">
               <span class="label">Contrato Vinculado</span>
               <div class="value">${createdOS.Contrato}</div>
            </div>` : ''}
            <div class="field">
               <span class="label">Telefone</span>
               <div class="value">${createdOS.Telefone || telefone}</div>
            </div>
            <div class="field full">
               <span class="label">Endereço</span>
               <div class="value">${createdOS.Endereco || endereco}</div>
            </div>
            <div class="field">
               <span class="label">Prioridade</span>
               <div class="value" style="text-transform: capitalize">${createdOS.prioridade || prioridade}</div>
            </div>
            <div class="field">
               <span class="label">Data Prevista</span>
               <div class="value">${createdOS.dataPrevista || dataPrevista}</div>
            </div>
            <div class="field full">
               <span class="label">Descrição do Serviço</span>
               <div class="value">${createdOS.Descricao || servico}</div>
            </div>
             <div class="field full">
               <span class="label">Observações</span>
               <div class="value">${createdOS.Observacoes || obs || '-'}</div>
            </div>
          </div>

          <div class="footer">
            <p>ARARA - Gestão de Chamados Internos</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `)
    win.document.close()
  }

  function handleClose() {
    setShowModal(false)
    // Optional: Reset form or redirect
    // setNome(''); setTelefone(''); ...
  }

  return (
    <>
      {showModal && createdOS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="bg-blue-600/10 p-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
                        <CheckCircle className="text-blue-500" />
                        Ordem de Serviço Criada
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <span className="text-sm text-gray-400">Cliente</span>
                            <p className="font-medium text-lg">{createdOS.Nome || createdOS.nome}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm text-gray-400">CPF/CNPJ</span>
                            <p className="font-medium text-lg">{createdOS.CpfCnpj || createdOS.cpfCnpj || cnpj || '-'}</p>
                        </div>
                        {createdOS.Contrato && (
                            <div className="space-y-1">
                                <span className="text-sm text-gray-400">Contrato</span>
                                <p className="font-medium text-lg">{createdOS.Contrato || createdOS.contrato}</p>
                            </div>
                        )}
                        <div className="space-y-1">
                            <span className="text-sm text-gray-400">Telefone</span>
                            <p className="font-medium text-lg">{createdOS.Telefone || createdOS.telefone}</p>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <span className="text-sm text-gray-400">Endereço</span>
                            <p className="font-medium text-gray-200">{createdOS.Endereco || createdOS.endereco}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm text-gray-400">Prioridade</span>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                (createdOS.prioridade === 'alta') ? 'bg-red-500/20 text-red-400' :
                                (createdOS.prioridade === 'media') ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-green-500/20 text-green-400'
                            }`}>
                                {(createdOS.prioridade)?.toUpperCase()}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm text-gray-400">Data Prevista</span>
                            <p className="font-medium">{createdOS.dataPrevista}</p>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <span className="text-sm text-gray-400">Serviço</span>
                            <p className="font-medium text-gray-200">{createdOS.Descricao || createdOS.descricao}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white/5 border-t border-white/10 flex flex-wrap gap-3 justify-end">
                    <button onClick={handleClose} className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 transition-colors flex items-center gap-2">
                        <Edit size={18} />
                        Editar
                    </button>
                    <button onClick={handlePrint} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20">
                        <Printer size={18} />
                        Imprimir PDF
                    </button>
                    <button onClick={handleClose} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Header Removed - Managed by Layout */}
      
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <form className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl" onSubmit={submit}>
            
            <div className="col-span-full mb-2">
                <h2 className="text-lg font-semibold text-blue-400 mb-1">Dados do Cliente</h2>
                <div className="h-px bg-gradient-to-r from-blue-500/50 to-transparent w-full"></div>
            </div>

            <div className="col-span-full">
                <InputCliente onData={onClienteData} />
            </div>

            <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-300">CPF / CNPJ</label>
                <div className="relative">
                    <input className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-11 text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600" value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="000.000.000-00" />
                    <FileDigit className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                </div>
            </div>

            <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-300">Contrato Vinculado</label>
                <div className="relative">
                    {loadingContracts ? (
                        <div className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-gray-400 flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            Buscando...
                        </div>
                    ) : contracts.length > 0 ? (
                        <>
                            <select 
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-11 text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                                value={selectedContract}
                                onChange={e => setSelectedContract(e.target.value)}
                            >
                                <option value="">Selecione um contrato...</option>
                                {contracts.map((c: Contrato) => (
                                    <option key={c.Numero} value={c.Numero}>
                                        Contrato #{c.Numero} - {c.Status || 'Ativo'} {c.DataEmissao ? `(${new Date(c.DataEmissao).toLocaleDateString('pt-BR')})` : ''}
                                    </option>
                                ))}
                            </select>
                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        </>
                    ) : (
                        <div className="relative">
                            <select disabled className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-11 text-gray-500 outline-none appearance-none cursor-not-allowed">
                                <option>Nenhum contrato disponível</option>
                            </select>
                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        </div>
                    )}
                </div>
            </div>
            
            <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-300">Nome do Cliente</label>
                <div className="relative">
                    <input className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-11 text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                </div>
            </div>
            
            <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-300">Telefone</label>
                <div className="relative">
                    <input className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-11 text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                </div>
            </div>
            
            <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-300">Email</label>
                <div className="relative">
                    <input className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-11 text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600" value={email} onChange={e => setEmail(e.target.value)} placeholder="exemplo@email.com" />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                </div>
            </div>
            
            <div className="col-span-full">
                <InputEndereco value={endereco} />
            </div>

            <div className="col-span-full mt-6 mb-2">
                <h2 className="text-lg font-semibold text-purple-400 mb-1">Detalhes do Serviço</h2>
                <div className="h-px bg-gradient-to-r from-purple-500/50 to-transparent w-full"></div>
            </div>

            <SelectPrioridade value={prioridade} onChange={setPrioridade} />
            
            <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-300">Data prevista</label>
                <div className="relative">
                    <input type="date" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-11 text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600 [color-scheme:dark]" value={dataPrevista} onChange={e => setDataPrevista(e.target.value)} />
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                </div>
            </div>
            
            <TextAreaServico value={servico} onChange={setServico} />
            
            <div className="grid gap-2 col-span-full">
                <label className="text-sm font-medium text-gray-300">Observações Adicionais</label>
                <div className="relative">
                    <textarea rows={3} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-11 text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-y placeholder:text-gray-600" value={obs} onChange={e => setObs(e.target.value)} placeholder="Alguma observação importante?" />
                    <FileText className="absolute left-4 top-4 text-gray-500" size={18} />
                </div>
            </div>

            <div className="col-span-full flex gap-4 pt-6 mt-4 border-t border-white/10">
                <button type="submit" className="flex-1 px-6 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-blue-600/20">
                    <Save size={20} />
                    Salvar Ordem de Serviço
                </button>
                <Link href="/os" className="px-6 py-4 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white font-medium transition-colors">
                    Cancelar
                </Link>
            </div>
            
            {msg.text && (
                <div className={`col-span-full p-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${msg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : msg.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-gray-800 text-gray-400'}`}>
                    {msg.text}
                </div>
            )}
        </form>
      </div>
    </>
  )
}