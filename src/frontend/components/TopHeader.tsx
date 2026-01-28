"use client"

import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import UserMenu from './UserMenu'
import { UserSession } from '@/backend/auth/authContext'

interface TopHeaderProps {
  user: UserSession
}

function getPageTitle(pathname: string) {
  if (pathname === '/' || pathname === '/dashboard') return 'Dashboard'
  if (pathname === '/os') return 'Ordens de Serviço'
  if (pathname === '/os/nova') return 'Nova Ordem de Serviço'
  if (pathname.startsWith('/os/')) return 'Detalhes da OS'
  if (pathname === '/contratos') return 'Contratos'
  if (pathname.startsWith('/contratos/')) return 'Detalhes do Contrato'
  if (pathname === '/financeiro') return 'Financeiro'
  return 'ARARA'
}

export default function TopHeader({ user }: TopHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  return (
    <header className="h-20 bg-gray-900/50 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          title="Voltar"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <UserMenu user={user} />
      </div>
    </header>
  )
}
