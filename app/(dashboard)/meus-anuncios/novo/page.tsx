import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AnnouncementWizard } from '@/components/announcement/AnnouncementWizard'
import type { Category } from '@/types'

export const metadata = {
  title: 'Criar Anúncio — GameMarket',
  description: 'Crie um novo anúncio para vender produtos digitais na GameMarket.',
}

export default async function NovoAnuncioPage() {
  const supabase = await createClient()

  // Auth guard
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/painel/meus-anuncios/novo')

  // Fetch all active categories (roots + subs) server-side
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('status', true)
    .order('sort_order', { ascending: true })

  if (error || !categories) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-sm text-red-400">Erro ao carregar categorias. Tente novamente.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10">
      <div className="mx-auto max-w-3xl mb-8">
        <h1 className="text-2xl font-bold text-white">Criar novo anúncio</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Preencha as informações do seu produto em 4 passos simples.
        </p>
      </div>
      <AnnouncementWizard categories={categories as Category[]} />
    </div>
  )
}