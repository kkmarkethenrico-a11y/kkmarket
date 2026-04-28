import Link from 'next/link'

const LINKS = {
  'Acesso Rápido': [
    { label: 'Anunciar', href: '/meus-anuncios/novo' },
    { label: 'Blog', href: '/blog' },
    { label: 'Perguntas frequentes', href: '/perguntas-frequentes' },
    { label: 'Categorias', href: '/categorias' },
  ],
  'Como Funciona': [
    { label: 'Como funciona', href: '/como-funciona' },
    { label: 'Tarifas e prazos', href: '/tarifas-e-prazos' },
    { label: 'Formas de pagamento', href: '/formas-de-pagamento' },
    { label: 'Programa de pontos', href: '/programa-de-pontos' },
    { label: 'Verificador de contas', href: '/verificador' },
    { label: 'Ranking de Vendedores', href: '/ranking' },
  ],
  'Institucional': [
    { label: 'Termos de uso', href: '/termos' },
    { label: 'Política de privacidade', href: '/privacidade' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/60 bg-zinc-950">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">

          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="rounded-lg bg-violet-600 p-1.5">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
                </svg>
              </span>
              <span className="text-lg font-black tracking-tight text-white">GameMarket</span>
            </Link>
            <p className="text-sm leading-relaxed text-zinc-500">
              Somos a solução para o mercado digital, disponibilizando uma plataforma moderna que permite que o comprador receba pelo produto desejado, e que o vendedor receba pela sua venda. Tudo isso com praticidade e segurança.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-zinc-800/40">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-zinc-600 sm:flex-row">
          <span>Copyright © GameMarket {new Date().getFullYear()}</span>
          <span>Plataforma de marketplace de produtos digitais</span>
        </div>
      </div>
    </footer>
  )
}
