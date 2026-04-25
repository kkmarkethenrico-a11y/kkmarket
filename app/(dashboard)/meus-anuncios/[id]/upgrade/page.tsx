import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import UpgradePlanForm from './UpgradePlanForm'
import type { AnnouncementPlan } from '@/types'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function UpgradePlanPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: ann, error } = await supabase
    .from('announcements')
    .select('id, user_id, title, plan, status, slug')
    .eq('id', id)
    .single()

  if (error || !ann) notFound()
  if (ann.user_id !== user.id) redirect('/meus-anuncios')

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/meus-anuncios" className="hover:text-zinc-300">Meus anúncios</Link>
        <span>/</span>
        <span className="text-zinc-200">{ann.title}</span>
        <span>/</span>
        <span className="text-zinc-200 font-medium">Upgrade de plano</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Atualize o plano do seu anúncio</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Plano atual: <span className="font-semibold text-zinc-200">{ann.plan.toUpperCase()}</span>
          {' · '}Status: <span className="font-semibold text-zinc-200">{ann.status}</span>
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        <strong>Atenção:</strong> ao trocar de plano, o anúncio voltará para o status{' '}
        <span className="font-mono">pending</span> e precisará ser revisado pela moderação antes
        de aparecer novamente nas buscas.
      </div>

      <UpgradePlanForm
        announcementId={ann.id}
        currentPlan={ann.plan as AnnouncementPlan}
      />
    </div>
  )
}
