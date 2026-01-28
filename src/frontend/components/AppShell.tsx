"use client"

import { useState } from 'react'
import Sidebar from './Sidebar'
import TopHeader from './TopHeader'
import { UserSession } from '@/backend/auth/authContext'

interface AppShellProps {
  children: React.ReactNode
  user: UserSession
}

export default function AppShell({ children, user }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(true)

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} user={user} />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}
      >
        <TopHeader user={user} />
        
        <main className="flex-1 p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
