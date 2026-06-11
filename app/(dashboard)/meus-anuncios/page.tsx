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

  const active   = announcements?.filter((a) => a.status === 'active').length ?? 0
  const paused   = announcements?.filter((a) => a.status === 'paused').length ?? 0
  const sold     = announcements?.filter((a) => a.status === 'sold_out').length ?? 0
  const totalSales = announcements?.reduce((s, a) => s + (a.sale_count ?? 0), 0) ?? 0

  return (
    <div className="min-h-screen text-[var(--gm-ink)]">
      <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="rank-chip mb-2 inline-flex">📢 MEUS ANÚNCIOS</div>
            <h1 className="text-2xl font-black text-[var(--gm-ink)]">gerenciar anúncios</h1>
            <p className="text-sm text-[var(--gm-ink-faint)] mt-0.5">
              {active} ativos · {paused} pausados · {totalSales} vendidos
            </p>
          </div>
          <Link
            href="/meus-anuncios/novo"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--gm-violet)] px-5 py-2.5 text-sm font-black text-[#1a1126] hover:opacity-90 transition-all gm-glow"
          >
            + criar anúncio
          </Link>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'VENDAS MÊS', value: fmtBRL(0), cls: 'text-[var(--gm-green)]' },
            { label: 'PEDIDOS', value: String(totalSales), cls: 'text-[var(--gm-ink)]' },
            { label: 'ATIVOS', value: String(active), cls: 'text-[var(--gm-violet)]' },
            { label: 'CONVERSÃO', value: '—', cls: 'text-[var(--gm-cyan)]' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-2)] p-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--gm-ink-faint)]">{s.label}</p>
              <p className={`text-xl font-black mt-1 ${s.cls}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-2)] p-1 w-fit">
          {TABS.map((t) => (
            <Link
              key={t.value}
              href={`/meus-anuncios?tab=${t.value}`}
              className={`rounded-md px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
                tab === t.value
                  ? 'bg-[var(--gm-violet)] text-[#1a1126]'
                  : 'text-[var(--gm-ink-faint)] hover:text-[var(--gm-ink)]'
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
            <p className="text-base font-bold text-[var(--gm-ink-dim)]">Nenhum anúncio encontrado</p>
            <p className="text-sm text-[var(--gm-ink-faint)]">
              {tab === 'all'
                ? 'Você ainda não criou nenhum anúncio.'
                : `Nenhum anúncio com status "${TABS.find((t) => t.value === tab)?.label}".`}
            </p>
            <Link
              href="/meus-anuncios/novo"
              className="mt-2 rounded-lg bg-[var(--gm-violet)] px-5 py-2.5 text-sm font-black text-[#1a1126] hover:opacity-90 transition-all gm-glow"
            >
              + criar meu primeiro anúncio
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {announcements.map((ann) => {
              const cover = ann.announcement_images?.find((i: { is_cover: boolean }) => i.is_cover)
                ?? ann.announcement_images?.[0]
              const status = STATUS_LABELS[ann.status] ?? { label: ann.status, cls: 'bg-[var(--gm-ink-faint)]/20 text-[var(--gm-ink-faint)] border-[var(--gm-ink-faint)]/20' }
              const plan = PLAN_LABELS[ann.plan] ?? { label: ann.plan, cls: 'text-[var(--gm-ink-faint)]' }
              const category = (ann.categories as unknown as { name: string } | null)?.name ?? '—'

              return (
                <div
                  key={ann.id}
                  className="flex flex-col sm:flex-row gap-4 rounded-xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-2)] p-4 hover:border-[var(--gm-violet)]/30 transition-colors"
                >
                  {/* Imagem */}
                  <div className="relative h-28 w-full sm:h-20 sm:w-36 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--gm-paper-3)]">
                    {cover?.url ? (
                      <Image
                        src={cover.url}
                        alt={ann.title}
                        fill
                        className="object-cover"
                        sizes="144px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl text-[var(--gm-ink-faint)]">🎮</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col gap-2 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-black text-[var(--gm-ink)] truncate">{ann.title}</p>
                        <p className="text-xs text-[var(--gm-ink-faint)] mt-0.5">{category} · <span className={plan.cls}>{plan.label}</span></p>
                      </div>
                      <span className={`shrink-0 rounded-lg border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${status.cls}`}>
                        {status.label}
                      </span>
                    </div>

                    {ann.status === 'rejected' && ann.rejection_reason && (
                      <p className="text-xs text-[var(--gm-rose)] bg-[var(--gm-rose)]/10 border border-[var(--gm-rose)]/20 rounded-lg px-3 py-2">
                        <span className="font-bold">Motivo: </span>{ann.rejection_reason}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--gm-ink-faint)] mt-auto">
                      <span className="font-black text-[var(--gm-green)]">{fmtBRL(ann.unit_price)}</span>
                      <span>estoque: {ann.stock_quantity ?? '—'}</span>
                      <span>{ann.view_count ?? 0} views</span>
                      <span>{ann.sale_count ?? 0} vendas</span>
                      {ann.has_auto_delivery && (
                        <span className="rank-chip green text-[9px]">⚡ auto</span>
                      )}
                      <span className="ml-auto text-[var(--gm-ink-faint)]">{fmtDate(ann.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 shrink-0 justify-end sm:justify-start">
                    <Link
                      href={`/anuncio/${ann.slug}`}
                      className="rounded-lg border border-[var(--gm-ink-faint)]/30 px-3 py-1.5 text-xs font-bold text-[var(--gm-ink-dim)] hover:border-[var(--gm-violet)]/50 hover:text-[var(--gm-ink)] transition-colors text-center"
                    >
                      Ver
                    </Link>
                    {ann.status === 'active' && (
                      <Link
                        href={`/meus-anuncios/${ann.id}/auto-delivery`}
                        className="rounded-lg border border-[var(--gm-violet)]/30 px-3 py-1.5 text-xs font-bold text-[var(--gm-violet)] hover:bg-[var(--gm-violet)]/10 transition-colors text-center"
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
