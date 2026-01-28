"use client"

import { useState, useEffect } from 'react'
import { User } from '@/backend/auth/authContext'
import { Save, AlertCircle, Loader2, User as UserIcon, Settings, Sliders } from 'lucide-react'
import { SystemConfig } from '@/backend/config/systemConfig'
import { UserParameters } from '@/backend/config/systemParameters'

export default function ConfiguracoesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'perfil' | 'sistema'>('perfil')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchUser()
  }, [])

  async function fetchUser() {
    try {
      const res = await fetch('/api/users/me')
      if (!res.ok) throw new Error('Falha ao carregar perfil')
      const data = await res.json()
      setUser(data)
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Não foi possível carregar suas informações.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          parametros: user.parametros,
          configuracoes: user.configuracoes
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erro ao salvar alterações')
      }

      const updatedUser = await res.json()
      setUser(updatedUser)
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    )
  }

  if (!user) return null

  const isAdmin = user.roles.includes('ADMIN')

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
      <p className="text-gray-400 mb-8">Gerencie seu perfil e preferências do sistema.</p>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 mb-8">
        <button
          onClick={() => setActiveTab('perfil')}
          className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
            activeTab === 'perfil' ? 'text-blue-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <UserIcon size={18} />
            Meu Perfil & Preferências
          </div>
          {activeTab === 'perfil' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />
          )}
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('sistema')}
            className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
              activeTab === 'sistema' ? 'text-blue-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings size={18} />
              Configuração do Sistema
            </div>
            {activeTab === 'sistema' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />
            )}
          </button>
        )}
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          <AlertCircle size={20} />
          <p>{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSave}>
        {activeTab === 'perfil' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Identidade */}
            <section className="bg-gray-800/50 border border-white/5 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <UserIcon size={20} className="text-blue-500" />
                Identidade
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={user.name}
                    onChange={e => setUser({ ...user, name: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-600 mt-1">O email não pode ser alterado.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Papéis (Roles)</label>
                  <div className="flex gap-2">
                    {user.roles.map(role => (
                      <span key={role} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded border border-blue-500/30">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Parâmetros de UI */}
            <section className="bg-gray-800/50 border border-white/5 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Sliders size={20} className="text-purple-500" />
                Preferências de Interface
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Tema</label>
                  <select
                    value={user.parametros.tema}
                    onChange={e => setUser({
                      ...user,
                      parametros: { ...user.parametros, tema: e.target.value as any }
                    })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="system" className="bg-gray-800">Sistema</option>
                    <option value="dark" className="bg-gray-800">Escuro</option>
                    <option value="light" className="bg-gray-800">Claro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Densidade da Interface</label>
                  <select
                    value={user.parametros.densidadeUI}
                    onChange={e => setUser({
                      ...user,
                      parametros: { ...user.parametros, densidadeUI: e.target.value as any }
                    })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="comfortable" className="bg-gray-800">Confortável</option>
                    <option value="compact" className="bg-gray-800">Compacta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Idioma</label>
                  <select
                    value={user.parametros.idioma}
                    onChange={e => setUser({
                      ...user,
                      parametros: { ...user.parametros, idioma: e.target.value as any }
                    })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="pt-BR" className="bg-gray-800">Português (BR)</option>
                    <option value="en-US" className="bg-gray-800">English (US)</option>
                  </select>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'sistema' && isAdmin && user.configuracoes && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <section className="bg-gray-800/50 border border-white/5 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Settings size={20} className="text-orange-500" />
                Configurações Globais
              </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5">
                  <div>
                    <h3 className="text-white font-medium">Módulo Kanban</h3>
                    <p className="text-sm text-gray-500">Habilita a visualização de quadros e cartões.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={user.configuracoes.kanbanAtivo}
                      onChange={e => setUser({
                        ...user,
                        configuracoes: { ...user.configuracoes!, kanbanAtivo: e.target.checked }
                      })}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5">
                  <div>
                    <h3 className="text-white font-medium">Impressão Automática</h3>
                    <p className="text-sm text-gray-500">Envia ordens de serviço direto para a impressora padrão.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={user.configuracoes.impressaoAutomatica}
                      onChange={e => setUser({
                        ...user,
                        configuracoes: { ...user.configuracoes!, impressaoAutomatica: e.target.checked }
                      })}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5">
                  <div>
                    <h3 className="text-white font-medium">Modo Manutenção</h3>
                    <p className="text-sm text-gray-500">Bloqueia acesso de usuários comuns ao sistema.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={user.configuracoes.modoManutencao}
                      onChange={e => setUser({
                        ...user,
                        configuracoes: { ...user.configuracoes!, modoManutencao: e.target.checked }
                      })}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-8 flex justify-end pt-6 border-t border-white/10">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={20} />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
