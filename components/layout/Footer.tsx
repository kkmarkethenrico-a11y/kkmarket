import Link from 'next/link'
import Image from 'next/image'
import { getDictionary } from '@/lib/i18n'

export async function Footer() {
  const dict = await getDictionary()

  const LINKS = {
    [dict.footer.links.quickAccess]: [
      { label: dict.footer.items.announce, href: '/meus-anuncios/novo' },
      { label: dict.footer.items.blog, href: '/blog' },
      { label: dict.footer.items.faq, href: '/perguntas-frequentes' },
      { label: dict.footer.items.categories, href: '/categorias' },
    ],
    [dict.footer.links.howItWorks]: [
      { label: dict.footer.items.howItWorks, href: '/como-funciona' },
      { label: dict.footer.items.fees, href: '/tarifas-e-prazos' },
      { label: dict.footer.items.paymentMethods, href: '/formas-de-pagamento' },
      { label: dict.footer.items.pointsProgram, href: '/programa-de-pontos' },
      { label: dict.footer.items.accountChecker, href: '/verificador' },
      { label: dict.footer.items.sellerRanking, href: '/ranking' },
    ],
    [dict.footer.links.institutional]: [
      { label: dict.footer.items.terms, href: '/termos' },
      { label: dict.footer.items.privacy, href: '/privacidade' },
    ],
  }

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
              {dict.footer.description}
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
          <span>Copyright © KKmarket {new Date().getFullYear()}</span>
          <span>{dict.footer.copyright}</span>
        </div>
      </div>
    </footer>
  )
}
