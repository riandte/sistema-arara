"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User as UserIcon, Loader2, Settings } from 'lucide-react'
import Link from 'next/link'
import { UserSession } from '@/backend/auth/authContext'

interface UserMenuProps {
  user: UserSession
}

export default function UserMenu({ user }: UserMenuProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  // Format name: First two names only
  const displayName = user.name
    .split(' ')
    .slice(0, 2)
    .join(' ')

  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  async function handleLogout() {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('Logout failed', err)
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-colors group outline-none"
      >
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
          <span className="font-bold text-white text-sm tracking-wider">{initials}</span>
        </div>
        <div className="text-left hidden md:block">
          <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{displayName}</p>
          <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">Conectado</p>
        </div>
      </button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)} 
          />
          <div className="absolute right-0 top-full mt-2 w-56 bg-gray-900 border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
             <div className="px-4 py-3 border-b border-white/5 mb-2 md:hidden">
                <p className="text-sm font-medium text-white">{displayName}</p>
             </div>
             
             <Link
                href="/configuracoes"
                onClick={() => setShowMenu(false)}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
             >
                <Settings size={16} />
                Configurações
             </Link>

             <button 
                onClick={handleLogout}
                disabled={loading}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
             >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <LogOut size={16} />}
                Sair do Sistema
             </button>
          </div>
        </>
      )}
    </div>
  )
}
