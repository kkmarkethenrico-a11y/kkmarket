import Link from 'next/link'
import Image from 'next/image'

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
    <footer className="border-t border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper)]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">

          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center mb-4 transition-opacity hover:opacity-90">
              <Image
                src="/images/logo.png"
                alt="KKmarket Logo"
                width={130}
                height={38}
                className="h-9.5 w-auto object-contain"
              />
            </Link>
            <p className="text-sm leading-relaxed text-[var(--gm-ink-dim)]">
              Somos o marketplace ideal para o mercado digital. Conectamos compradores e vendedores de forma segura, garantindo a entrega do produto e o pagamento, com total praticidade.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--gm-ink-dim)]">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-[var(--gm-ink-dim)] hover:text-[var(--gm-violet)] transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--gm-ink-faint)]/15">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-[var(--gm-ink-dim)] sm:flex-row">
          <span>Copyright © GameMarket {new Date().getFullYear()}</span>
          <span>Plataforma de marketplace de produtos digitais</span>
        </div>
      </div>
    </footer>
  )
}
