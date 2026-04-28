import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import type { AnnouncementStatus, AnnouncementPlan } from '@/types'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Aguardando aprovação', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  active:    { label: 'Ativo',                cls: 'bg-green-500/20 text-green-300 border-green-500/30' },
  paused:    { label: 'Pausado',              cls: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30' },
  rejected:  { label: 'Reprovado',            cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
  sold_out:  { label: 'Esgotado',             cls: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  deleted:   { label: 'Excluído',             cls: 'bg-zinc-700/40 text-zinc-500 border-zinc-700/30' },
}

const PLAN_LABELS: Record<string, { label: string; cls: string }> = {
  silver:  { label: 'Silver',  cls: 'text-zinc-400' },
  gold:    { label: 'Gold',    cls: 'text-amber-400' },
  diamond: { label: 'Diamond', cls: 'text-cyan-400' },
}

const TABS: { value: string; label: string }[] = [
  { value: 'all',      label: 'Todos' },
  { value: 'active',   label: 'Ativos' },
  { value: 'pending',  label: 'Pendentes' },
  { value: 'paused',   label: 'Pausados' },
  { value: 'rejected', label: 'Reprovados' },
]

function fmtBRL(n: number | null) {
  if (n === null) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function MeusAnunciosPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const tab = sp.tab ?? 'all'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase
    .from('announcements')
    .select(`
      id, title, slug, model, plan, unit_price, stock_quantity,
      has_auto_delivery, sale_count, view_count,
      status, rejection_reason, created_at,
      categories:category_id (name),
      announcement_images (url, is_cover, sort_order)
    `)
    .eq('user_id', user.id)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })

  if (tab !== 'all') {
    query = query.eq('status', tab as AnnouncementStatus)
  }

  const { data: announcements } = await query

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Meus Anúncios</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Gerencie seus anúncios publicados</p>
          </div>
          <Link
            href="/meus-anuncios/novo"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
          >
            + Novo anúncio
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1 w-fit">
          {TABS.map((t) => (
            <Link
              key={t.value}
              href={`/meus-anuncios?tab=${t.value}`}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                tab === t.value
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* List */}
        {!announcements?.length ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <span className="text-5xl">📦</span>
            <p className="text-zinc-400 text-lg font-medium">Nenhum anúncio encontrado</p>
            <p className="text-zinc-600 text-sm">
              {tab === 'all'
                ? 'Você ainda não criou nenhum anúncio.'
                : `Nenhum anúncio com status "${TABS.find((t) => t.value === tab)?.label}".`}
            </p>
            <Link
              href="/meus-anuncios/novo"
              className="mt-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
            >
              Criar meu primeiro anúncio
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {announcements.map((ann) => {
              const cover = ann.announcement_images?.find((i: { is_cover: boolean }) => i.is_cover)
                ?? ann.announcement_images?.[0]
              const status = STATUS_LABELS[ann.status] ?? { label: ann.status, cls: 'bg-zinc-700 text-zinc-300' }
              const plan = PLAN_LABELS[ann.plan] ?? { label: ann.plan, cls: 'text-zinc-400' }
              const category = (ann.categories as unknown as { name: string } | null)?.name ?? '—'

              return (
                <div
                  key={ann.id}
                  className="flex flex-col sm:flex-row gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-700 transition-colors"
                >
                  {/* Imagem */}
                  <div className="relative h-28 w-full sm:h-24 sm:w-40 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                    {cover?.url ? (
                      <Image
                        src={cover.url}
                        alt={ann.title}
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl text-zinc-700">🎮</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col gap-2 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{ann.title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{category} · <span className={plan.cls}>{plan.label}</span></p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-3 py-0.5 text-xs font-medium ${status.cls}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Rejection reason */}
                    {ann.status === 'rejected' && ann.rejection_reason && (
                      <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                        <span className="font-semibold">Motivo: </span>{ann.rejection_reason}
                      </p>
                    )}

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 mt-auto">
                      <span>{fmtBRL(ann.unit_price)}</span>
                      <span>Estoque: {ann.stock_quantity ?? '—'}</span>
                      <span>{ann.view_count ?? 0} views</span>
                      <span>{ann.sale_count ?? 0} vendas</span>
                      {ann.has_auto_delivery && (
                        <span className="text-violet-400">⚡ Entrega automática</span>
                      )}
                      <span className="ml-auto">Criado em {fmtDate(ann.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 shrink-0 justify-end sm:justify-start">
                    <Link
                      href={`/anuncio/${ann.slug}`}
                      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors text-center"
                    >
                      Ver
                    </Link>
                    {ann.status === 'active' && (
                      <Link
                        href={`/meus-anuncios/${ann.id}/auto-delivery`}
                        className="rounded-lg border border-violet-700/50 px-3 py-1.5 text-xs font-medium text-violet-300 hover:border-violet-500 transition-colors text-center"
                      >
                        Entrega
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
