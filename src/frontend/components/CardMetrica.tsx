export default function CardMetrica({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-white/5 p-4 shadow-lg">
      <div className="text-sm text-gray-400">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
    </div>
  )
}
