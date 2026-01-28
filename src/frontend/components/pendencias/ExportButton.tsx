"use client"

import { useState } from 'react'
import { Download, FileText, Printer, ChevronDown } from 'lucide-react'
import { PendenciaFilters } from '@/backend/services/pendenciaService'

interface ExportButtonProps {
  filters: PendenciaFilters
}

export function ExportButton({ filters }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const buildQuery = () => {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.tipo) params.set('tipo', filters.tipo)
      if (filters.responsavelId) params.set('responsavelId', filters.responsavelId)
      if (filters.setorResponsavel) params.set('setorResponsavel', filters.setorResponsavel)
      if (filters.criadoPor) params.set('criadoPor', filters.criadoPor)
      if (filters.dataInicio) params.set('dataInicio', filters.dataInicio)
      if (filters.dataFim) params.set('dataFim', filters.dataFim)
      if (filters.termo) params.set('termo', filters.termo)
      return params.toString()
  }

  const handleExportCSV = () => {
    window.location.href = `/api/pendencias/export/csv?${buildQuery()}`
    setIsOpen(false)
  }

  const handlePrint = () => {
    window.open(`/api/pendencias/export/print?${buildQuery()}`, '_blank')
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-gray-300 font-medium h-full"
      >
        <Download size={18} />
        Exportar
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
            <button 
                onClick={handleExportCSV}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
            >
                <FileText size={16} />
                Exportar CSV
            </button>
            <button 
                onClick={handlePrint}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
            >
                <Printer size={16} />
                Imprimir PDF
            </button>
        </div>
      )}
    </div>
  )
}
