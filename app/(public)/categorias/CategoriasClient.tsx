'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FolderOpen, Gamepad2, Share2, Bot, Code, Box, ChevronRight, ArrowRight } from 'lucide-react'
import type { Category } from '@/types'

interface CategoriasClientProps {
  rootCategories: Category[]
  gamesSubcategories: Category[]
}

function GameIcon({ slug, name, className = "h-4 w-4" }: { slug: string; name: string; className?: string }) {
  const [error, setError] = useState(false)

  if (error) {
    return <Gamepad2 className={className} />
  }

  return (
    <img
      src={`/images/games/${slug}.svg`}
      alt={name}
      className={`${className} shrink-0 object-contain`}
      onError={() => setError(true)}
    />
  )
}

function getCategoryIcon(slug: string) {
  switch (slug) {
    case 'jogos': return <Gamepad2 className="h-5 w-5 text-[var(--gm-violet)]" />
    case 'redes-sociais': return <Share2 className="h-5 w-5 text-[var(--gm-cyan)]" />
    case 'bots': return <Bot className="h-5 w-5 text-[var(--gm-green)]" />
    case 'scripts': return <Code className="h-5 w-5 text-[var(--gm-amber)]" />
    case 'outros-digitais': return <Box className="h-5 w-5 text-[var(--gm-ink)]" />
    default: return <FolderOpen className="h-5 w-5 text-[var(--gm-ink-faint)]" />
  }
}

export function CategoriasClient({ rootCategories, gamesSubcategories }: CategoriasClientProps) {
  // Combine games subcategories and other root categories for navigation
  const navItems = [
    ...gamesSubcategories.map(sub => ({
      name: sub.name,
      slug: sub.slug,
      href: `/categoria/jogos/${sub.slug}`,
      icon: <GameIcon slug={sub.slug} name={sub.name} className="h-4 w-4 text-[var(--gm-violet)]" />,
      parentSlug: 'jogos'
    })),
    ...rootCategories.filter(cat => cat.slug !== 'jogos').map(cat => ({
      name: cat.name,
      slug: cat.slug,
      href: `/categoria/${cat.slug}`,
      icon: getCategoryIcon(cat.slug),
      parentSlug: null
    }))
  ]

  const handleScrollToCategory = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24 bg-[var(--gm-paper-2)] border border-[var(--gm-ink-faint)]/20 rounded-2xl p-4 max-h-[85vh] overflow-y-auto">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--gm-ink-faint)] mb-4 px-2">
          Categorias
        </h2>
        <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
          {navItems.map(item => (
            <button
              key={item.slug}
              onClick={() => handleScrollToCategory(item.slug)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--gm-ink-dim)] hover:bg-[var(--gm-paper-3)] hover:text-[var(--gm-ink)] transition-all shrink-0 text-left w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--gm-violet)]/30"
            >
              {item.icon}
              <span className="truncate">{item.name}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Sections Container */}
      <div className="flex-1 w-full space-y-8">
        {navItems.map(item => (
          <section
            key={item.slug}
            id={item.slug}
            className="scroll-mt-24 rounded-2xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-2)] p-6 sm:p-8 transition-all hover:border-[var(--gm-violet)]/30 group relative overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[var(--gm-violet)]/5 blur-3xl transition-opacity group-hover:opacity-80" />

            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--gm-paper)] shadow-inner group-hover:scale-110 transition-transform border border-[var(--gm-ink-faint)]/10">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-xl font-black text-[var(--gm-ink)] group-hover:text-[var(--gm-violet)] transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-sm text-[var(--gm-ink-dim)] mt-0.5">
                    {item.parentSlug ? 'Subcategoria de Jogos' : 'Categoria Principal'}
                  </p>
                </div>
              </div>

              <Link
                href={item.href}
                className="rounded-xl border border-[var(--gm-ink-faint)]/30 bg-[var(--gm-paper-3)] hover:bg-[var(--gm-violet)]/10 hover:text-[var(--gm-violet)] hover:border-[var(--gm-violet)]/30 px-4 py-2 text-xs font-bold text-[var(--gm-ink)] transition-all flex items-center gap-1.5 shrink-0"
              >
                Ver tudo <ChevronRight className="h-4.5 w-4.5" />
              </Link>
            </div>

            {/* Quick shortcuts grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Contas', path: '?model=normal' },
                { label: 'Itens', path: '?q=itens' },
                { label: 'Serviços', path: '?q=serviços' },
              ].map(sub => (
                <Link
                  key={sub.label}
                  href={`${item.href}${sub.path}`}
                  className="flex items-center justify-between rounded-xl bg-[var(--gm-paper-3)]/60 hover:bg-[var(--gm-paper-3)] border border-[var(--gm-ink-faint)]/10 hover:border-[var(--gm-ink-faint)]/30 p-4 text-sm font-semibold transition-all group/sub"
                >
                  <span className="text-[var(--gm-ink-dim)] group-hover/sub:text-[var(--gm-ink)]">{sub.label}</span>
                  <ArrowRight className="h-4 w-4 text-[var(--gm-ink-faint)] group-hover/sub:text-[var(--gm-violet)] group-hover/sub:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
