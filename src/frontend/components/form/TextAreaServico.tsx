export default function TextAreaServico({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-2 col-span-full">
      <label className="text-sm font-medium text-gray-300">Descrição do serviço</label>
      <textarea 
        rows={5} 
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-y placeholder:text-gray-600" 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder="Descreva detalhadamente o serviço a ser realizado..."
      />
    </div>
  )
}
