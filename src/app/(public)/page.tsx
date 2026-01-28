import Link from 'next/link'
import { ClipboardList, ArrowRight, FileText, DollarSign } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col items-center justify-center p-4">
      
      <main className="max-w-4xl w-full text-center">
        
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            ARARA
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Gestão de Chamados Internos
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto w-full px-4">
            <Link href="/os" className="group relative flex flex-col items-center justify-center w-full max-w-sm h-64 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-3xl p-8 transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 mb-6 group-hover:scale-110 transition-transform duration-500">
                  <ClipboardList className="text-white" size={40} />
                </div>
                
                <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
                  Ordens de Serviço
                </h2>
                
                <div className="flex items-center gap-2 text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                  <span>Gerenciar chamados</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
        </div>

        <footer className="mt-20 flex flex-col items-center gap-2 text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Rian Duarte. Todos os direitos reservados.</p>
            <p className="flex items-center gap-1">
              <a 
                href="https://www.instagram.com/riandte/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium hover:underline"
              >
                @riandte
              </a>
            </p>
        </footer>

      </main>
    </div>
  )
}
