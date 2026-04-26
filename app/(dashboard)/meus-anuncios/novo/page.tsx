import { redirect } from 'next/navigation'
import Link from 'next/link'
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
  if (!user) redirect('/login?next=/meus-anuncios/novo')

  // Seller qualification guard
  const { data: profile } = await supabase
    .from('profiles')
    .select('seller_status')
    .eq('id', user.id)
    .single()

  if (profile?.seller_status !== 'approved') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8">
          <div className="mb-3 text-4xl">🔒</div>
          <h1 className="text-xl font-bold text-amber-200">Conta não qualificada para vender</h1>
          <p className="mt-2 text-sm text-amber-300/80">
            Para criar anúncios você precisa qualificar sua conta como vendedor.
            Envie seus documentos e aguarde a aprovação do nosso time.
          </p>
          <Link
            href="/verificacao"
            className="mt-6 inline-flex rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-violet-500 transition-colors"
          >
            Qualificar minha conta
          </Link>
        </div>
      </div>
    )
  }

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