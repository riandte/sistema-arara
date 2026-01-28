import Link from 'next/link'

export default function HeaderDashboard() {
  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="group">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">ARARA</h1>
          <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">Gestão integrada</p>
        </Link>
        <nav className="flex gap-1 text-sm font-medium">
          <Link className="px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors" href="/">
            Início
          </Link>
          <Link className="px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors" href="/os">
            Ordens de Serviço
          </Link>
        </nav>
      </div>
    </header>
  )
}
