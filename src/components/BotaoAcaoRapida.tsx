export default function BotaoAcaoRapida({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold shadow-lg hover:opacity-95">
      {children}
    </a>
  )
}
