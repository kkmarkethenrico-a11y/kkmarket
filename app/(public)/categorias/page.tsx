import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FolderOpen, Gamepad2, Share2, Bot, Code, Box, ChevronRight } from 'lucide-react'

export const metadata = {
  title: 'Categorias — KKmarket',
  description: 'Navegue por todas as categorias de produtos digitais no marketplace.',
}

function getCategoryIcon(slug: string) {
  switch (slug) {
    case 'jogos': return <Gamepad2 className="h-6 w-6 text-[var(--gm-violet)]" />
    case 'redes-sociais': return <Share2 className="h-6 w-6 text-[var(--gm-cyan)]" />
    case 'bots': return <Bot className="h-6 w-6 text-[var(--gm-green)]" />
    case 'scripts': return <Code className="h-6 w-6 text-[var(--gm-amber)]" />
    case 'outros-digitais': return <Box className="h-6 w-6 text-[var(--gm-ink)]" />
    default: return <FolderOpen className="h-6 w-6 text-[var(--gm-ink-faint)]" />
  }
}

export default async function CategoriasPage() {
  const supabase = await createClient()
  
  // Fetch only active root categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .eq('status', true)
    .order('sort_order', { ascending: true })

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16 min-h-[70vh]">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-[var(--gm-ink)]">Categorias</h1>
        <p className="mt-2 text-[var(--gm-ink-faint)]">
          Explore os departamentos e encontre exatamente o produto digital que você precisa.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories?.map((cat) => (
          <Link
            key={cat.id}
            href={`/categoria/${cat.slug}`}
            className="group flex items-center gap-4 rounded-2xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-2)] p-6 transition-all hover:border-[var(--gm-violet)]/50 hover:bg-[var(--gm-paper-3)]"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--gm-paper)] shadow-inner group-hover:scale-110 transition-transform">
              {getCategoryIcon(cat.slug)}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[var(--gm-ink)] group-hover:text-[var(--gm-violet)] transition-colors">
                {cat.name}
              </h3>
              <p className="text-sm text-[var(--gm-ink-dim)] line-clamp-1">{cat.description || 'Ver produtos dessa categoria'}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-[var(--gm-ink-faint)] group-hover:text-[var(--gm-violet)] transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}