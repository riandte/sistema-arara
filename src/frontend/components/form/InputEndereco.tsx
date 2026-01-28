import { MapPin } from 'lucide-react'

export default function InputEndereco({ value }: { value?: string }) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-gray-300">Endereço</label>
      <div className="relative">
        <input 
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-11 text-gray-300 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600 disabled:opacity-50" 
            value={value || ''} 
            readOnly 
            placeholder="Endereço será preenchido automaticamente..."
        />
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
      </div>
    </div>
  )
}
