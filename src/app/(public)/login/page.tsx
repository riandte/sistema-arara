"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, Lock, User, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      let data;
      try {
        data = await res.json()
      } catch (jsonError) {
        // Se não for JSON, provavelmente é um erro 500 do servidor web ou timeout
        throw new Error('Erro de comunicação com o servidor. Tente novamente mais tarde.')
      }

      if (res.ok && data.success) {
        router.push('/os') // Redirect to dashboard or home
        router.refresh() // Refresh to update middleware state
      } else {
        setError(data.message || 'Credenciais inválidas')
        // Limpar senha em caso de erro para forçar redigitação (segurança/UX)
        if (res.status === 401) {
            setPassword('')
        }
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Ocorreu um erro ao tentar entrar. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-blue-500/50">
            <Lock className="text-blue-500" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Restrito</h1>
          <p className="text-gray-400">Entre com suas credenciais para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Usuário</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="Seu usuário de rede"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Verificando...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Entrar no Sistema
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-600">
          &copy; 2025 ARARA. Acesso monitorado.
        </div>
      </div>
    </div>
  )
}
