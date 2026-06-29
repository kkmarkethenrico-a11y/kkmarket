import { createClient } from '@/lib/supabase/server'
import { CategoriasClient } from './CategoriasClient'
import type { Category } from '@/types'

export const metadata = {
  title: 'Categorias — KKmarket',
  description: 'Navegue por todas as categorias de produtos digitais no marketplace.',
}

export default async function CategoriasPage() {
  const supabase = await createClient()
  
  // Fetch active root categories
  const { data: rootCategories } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .eq('status', true)
    .order('sort_order', { ascending: true })

  // Find the 'jogos' category ID
  const gamesCategory = rootCategories?.find(c => c.slug === 'jogos')
  let gamesSubcategories: Category[] = []

  if (gamesCategory) {
    // Fetch active subcategories of games to display as sections
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', gamesCategory.id)
      .eq('status', true)
      .order('name', { ascending: true })
    gamesSubcategories = (data ?? []) as Category[]
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-16 min-h-[70vh]">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-[var(--gm-ink)]">Categorias</h1>
        <p className="mt-2 text-[var(--gm-ink-faint)]">
          Explore os departamentos e encontre exatamente o produto digital que você precisa.
        </p>
      </div>

      <CategoriasClient
        rootCategories={rootCategories ?? []}
        gamesSubcategories={gamesSubcategories}
      />
    </div>
  )
}