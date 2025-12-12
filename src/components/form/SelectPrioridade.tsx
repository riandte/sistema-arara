import { AlertTriangle } from 'lucide-react'

export default function SelectPrioridade({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-gray-300">Prioridade</label>
      <div className="relative">
        <select 
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-11 text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer hover:bg-white/10" 
            value={value} 
            onChange={e => onChange(e.target.value)}
        >
            <option value="baixa" className="bg-gray-800">Baixa</option>
            <option value="media" className="bg-gray-800">Média</option>
            <option value="alta" className="bg-gray-800">Alta</option>
        </select>
        <AlertTriangle className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${value === 'alta' ? 'text-red-400' : value === 'media' ? 'text-yellow-400' : 'text-green-400'}`} size={18} />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
      </div>
    </div>
  )
}
