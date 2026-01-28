"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  ClipboardList, 
  FileText, 
  DollarSign, 
  Home, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  CheckSquare,
  Settings,
  Users,
  Shield,
  Briefcase,
  Building2,
  UserCheck,
  ChevronDown
} from 'lucide-react'
import { UserSession } from '@/backend/auth/authContext'

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  user: UserSession
}

export default function Sidebar({ collapsed, setCollapsed, user }: SidebarProps) {
  const pathname = usePathname()
  const [configOpen, setConfigOpen] = useState(false)
  const isAdmin = user?.roles?.includes('ADMIN')

  const links = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/pendencias', label: 'Pendências', icon: CheckSquare },
    { href: '/os', label: 'Ordens de Serviço', icon: ClipboardList },
  ]

  const configLinks = [
    { href: '/configuracoes/usuarios', label: 'Usuários', icon: Users },
    { href: '/configuracoes/papeis', label: 'Papéis', icon: Shield },
    { href: '/configuracoes/setores', label: 'Setores', icon: Building2 },
    { href: '/configuracoes/cargos', label: 'Cargos', icon: Briefcase },
    { href: '/configuracoes/funcionarios', label: 'Funcionários', icon: UserCheck },
  ]

  return (
    <aside 
      className={`
        fixed left-0 top-0 h-screen bg-gray-900 border-r border-white/10 transition-all duration-300 z-30 flex flex-col
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Logo / Toggle */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
          {!collapsed && (
            <span className="font-bold text-xl text-white truncate">
              ARARA
            </span>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href) && !pathname.startsWith('/configuracoes'))
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }
                `}
                title={collapsed ? link.label : undefined}
              >
                <div className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                  <Icon size={24} />
                </div>
                
                {!collapsed && (
                  <span className="font-medium whitespace-nowrap">
                    {link.label}
                  </span>
                )}

                {collapsed && (
                   <div className="absolute left-16 bg-gray-800 text-white px-3 py-1 rounded-md text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap border border-white/10">
                     {link.label}
                   </div>
                )}
              </Link>
            )
          })}

          {/* Configurações (Admin Only) */}
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-white/10">
               {!collapsed ? (
                 <>
                   <button 
                     onClick={() => setConfigOpen(!configOpen)}
                     className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                   >
                      <div className="flex items-center gap-3">
                        <Settings size={24} />
                        <span className="font-medium">Configurações</span>
                      </div>
                      <ChevronDown size={16} className={`transition-transform ${configOpen ? 'rotate-180' : ''}`} />
                   </button>

                   <div className={`space-y-1 overflow-hidden transition-all duration-300 ${configOpen ? 'max-h-40 mt-1' : 'max-h-0'}`}>
                      {configLinks.map(link => {
                        const Icon = link.icon
                        const isActive = pathname.startsWith(link.href)
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={`
                              flex items-center gap-3 px-3 py-2 pl-12 rounded-xl transition-all text-sm
                              ${isActive 
                                ? 'text-blue-400 bg-blue-500/10' 
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                              }
                            `}
                          >
                             <Icon size={18} />
                             {link.label}
                          </Link>
                        )
                      })}
                   </div>
                 </>
               ) : (
                 // Collapsed View for Config
                 <div className="group relative">
                    <button className="w-full flex justify-center p-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                       <Settings size={24} />
                    </button>
                    
                    {/* Hover Menu for Collapsed */}
                    <div className="absolute left-16 top-0 bg-gray-900 border border-white/10 rounded-xl shadow-xl py-2 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-50">
                       <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 mb-1">
                          Configurações
                       </div>
                       {configLinks.map(link => (
                         <Link
                           key={link.href}
                           href={link.href}
                           className="flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                         >
                            <link.icon size={16} />
                            {link.label}
                         </Link>
                       ))}
                    </div>
                 </div>
               )}
            </div>
          )}
        </nav>

        {/* Footer info if needed */}
        {!collapsed && (
          <div className="p-6 text-xs text-gray-600 border-t border-white/10 shrink-0">
            &copy; 2025 ARARA
          </div>
        )}
      </div>
    </aside>
  )
}
