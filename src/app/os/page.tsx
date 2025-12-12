import Link from 'next/link'
import { Plus, Search, Filter } from 'lucide-react'

export default function OSListPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                    ← Voltar
                </Link>
                <h1 className="text-xl font-bold">Gestão de Ordens de Serviço</h1>
            </div>
            <Link href="/os/nova" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-blue-600/20">
                <Plus size={18} />
                Nova OS
            </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar por cliente, OS ou status..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                />
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-gray-300 font-medium">
                <Filter size={18} />
                Filtros
            </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center shadow-xl">
            <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-white/10">
                <Search size={40} className="text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-200 mb-3">Nenhuma OS encontrada</h3>
            <p className="text-gray-400 max-w-sm mx-auto mb-8 leading-relaxed">
                Você ainda não possui ordens de serviço cadastradas ou nenhum resultado corresponde à sua busca.
            </p>
            <Link href="/os/nova" className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-blue-600/20">
                <Plus size={20} />
                Criar primeira OS
            </Link>
        </div>

      </main>
    </div>
  )
}
