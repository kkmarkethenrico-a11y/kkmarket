import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import SellerActions from './SellerActions'

export const dynamic = 'force-dynamic'

const STATUS_CONFIG: Record<string, { label: string; cls: string; step: number }> = {
  pending_payment: { label: 'Aguardando pagamento', cls: 'bg-zinc-700/60 text-zinc-300 border-zinc-700',        step: 0 },
  paid:            { label: 'Pago',                 cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30',     step: 1 },
  in_delivery:     { label: 'Em entrega',           cls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', step: 2 },
  delivered:       { label: 'Entregue',             cls: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',     step: 3 },
  disputed:        { label: 'Em disputa',           cls: 'bg-red-500/20 text-red-300 border-red-500/30',        step: -1 },
  refunded:        { label: 'Reembolsado',          cls: 'bg-orange-500/20 text-orange-300 border-orange-500/30', step: -1 },
  cancelled:       { label: 'Cancelado',            cls: 'bg-zinc-700/40 text-zinc-500 border-zinc-700/30',     step: -1 },
  completed:       { label: 'Concluído',            cls: 'bg-green-500/20 text-green-300 border-green-500/30',  step: 4 },
}

const TIMELINE_STEPS = [
  { step: 0, label: 'Pedido criado' },
  { step: 1, label: 'Pagamento confirmado' },
  { step: 2, label: 'Em entrega' },
  { step: 3, label: 'Produto entregue' },
  { step: 4, label: 'Concluído' },
]

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MinhaVendaDetalhe({ params }: PageProps) {
  const { id: orderId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: order } = await admin
    .from('orders')
    .select(`
      id, status, amount, platform_fee, seller_amount, payment_method,
      escrow_release_at, buyer_confirmed_at, completed_at,
      cancelled_at, cancellation_reason, created_at, updated_at,
      announcements!announcement_id (
        title, slug,
        announcement_images (url, is_cover, sort_order)
      ),
      profiles!buyer_id (username, display_name, avatar_url)
    `)
    .eq('id', orderId)
    .eq('seller_id', user.id)
    .maybeSingle()

  if (!order) notFound()

  const ann = order.announcements as unknown as {
    title: string
    slug: string
    announcement_images: { url: string; is_cover: boolean; sort_order: number }[]
  } | null
  const buyer = (order as unknown as Record<string, unknown>)['profiles!buyer_id'] as {
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null

  const images = ann?.announcement_images ?? []
  const cover = images.find((i) => i.is_cover) ?? images[0]
  const statusCfg = STATUS_CONFIG[order.status] ?? { label: order.status, cls: 'bg-zinc-700 text-zinc-300 border-zinc-700', step: 0 }
  const currentStep = statusCfg.step

  // O valor já ficou em escrow; se completed, foi liberado
  const escrowReleased = order.status === 'completed'

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">

        {/* Voltar */}
        <Link href="/minhas-vendas" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          ← Minhas vendas
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">Venda #{order.id.slice(0, 8).toUpperCase()}</h1>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono">{order.id}</p>
          </div>
          <span className={`self-start sm:self-auto rounded-full border px-4 py-1 text-sm font-semibold ${statusCfg.cls}`}>
            {statusCfg.label}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">

            {/* Produto */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Produto</h2>
              <div className="flex gap-4">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                  {cover?.url ? (
                    <Image src={cover.url} alt={ann?.title ?? ''} fill className="object-cover" sizes="80px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl text-zinc-700">🎮</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{ann?.title ?? '—'}</p>
                  {ann?.slug && (
                    <Link href={`/anuncio/${ann.slug}`} className="text-xs text-violet-400 hover:underline mt-1 inline-block">
                      Ver anúncio →
                    </Link>
                  )}
                  {buyer && (
                    <div className="flex items-center gap-2 mt-3">
                      {buyer.avatar_url ? (
                        <Image src={buyer.avatar_url} alt={buyer.username} width={24} height={24} className="rounded-full object-cover" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400">
                          {buyer.username[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm text-zinc-400">
                        Comprado por{' '}
                        <Link href={`/perfil/${buyer.username}`} className="text-violet-400 hover:underline">
                          @{buyer.username}
                        </Link>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline */}
            {currentStep >= 0 && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-5">Andamento</h2>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-800" />
                  <div className="space-y-5">
                    {TIMELINE_STEPS.map(({ step, label }) => {
                      const done    = currentStep >= step
                      const current = currentStep === step
                      return (
                        <div key={step} className="flex items-center gap-4 relative pl-10">
                          <div className={`absolute left-0 h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                            done
                              ? current
                                ? 'border-violet-500 bg-violet-600 text-white'
                                : 'border-green-500 bg-green-600 text-white'
                              : 'border-zinc-700 bg-zinc-900 text-zinc-600'
                          }`}>
                            {done && !current ? '✓' : step + 1}
                          </div>
                          <span className={`text-sm font-medium ${done ? 'text-white' : 'text-zinc-600'}`}>
                            {label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Status especiais */}
            {order.status === 'disputed' && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
                <p className="text-sm font-semibold text-red-300">⚑ Este pedido está em disputa</p>
                <p className="text-xs text-zinc-500 mt-1">Nossa equipe irá analisar o caso em breve.</p>
              </div>
            )}

            {/* Escrow info */}
            {!escrowReleased && order.escrow_release_at && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
                <p className="text-sm font-semibold text-amber-300">🔒 Saldo em escrow</p>
                <p className="text-xs text-zinc-400 mt-1">
                  O valor de <strong>{fmtBRL(Number(order.seller_amount))}</strong> será liberado automaticamente
                  em <strong>{fmtDateTime(order.escrow_release_at)}</strong> caso o comprador não abra disputa.
                </p>
              </div>
            )}

            {escrowReleased && (
              <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5">
                <p className="text-sm font-semibold text-green-300">✓ Saldo liberado</p>
                <p className="text-xs text-zinc-400 mt-1">
                  {fmtBRL(Number(order.seller_amount))} adicionados ao seu saldo.
                </p>
              </div>
            )}

            {/* Ações do vendedor */}
            <SellerActions orderId={order.id} status={order.status} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Financeiro */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Financeiro</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Valor bruto</span>
                  <span className="text-zinc-300">{fmtBRL(Number(order.amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Taxa plataforma</span>
                  <span className="text-red-400">− {fmtBRL(Number(order.platform_fee))}</span>
                </div>
                <div className="border-t border-zinc-800 pt-2 flex justify-between">
                  <span className="text-zinc-400 font-medium">Valor líquido</span>
                  <span className="font-bold text-white">{fmtBRL(Number(order.seller_amount))}</span>
                </div>
              </div>
            </div>

            {/* Datas */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Datas</h2>
              <div className="space-y-2 text-xs text-zinc-500">
                <div>
                  <span className="block text-zinc-600">Criado em</span>
                  <span className="text-zinc-300">{fmtDateTime(order.created_at)}</span>
                </div>
                {order.buyer_confirmed_at && (
                  <div>
                    <span className="block text-zinc-600">Comprador confirmou</span>
                    <span className="text-zinc-300">{fmtDateTime(order.buyer_confirmed_at)}</span>
                  </div>
                )}
                {order.completed_at && (
                  <div>
                    <span className="block text-zinc-600">Concluído em</span>
                    <span className="text-zinc-300">{fmtDateTime(order.completed_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chat */}
            <Link
              href={`/chat/${order.id}`}
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-zinc-700 bg-zinc-900/40 px-4 py-2.5 text-sm text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
            >
              💬 Abrir chat com comprador
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
