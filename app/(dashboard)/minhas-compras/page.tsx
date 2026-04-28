import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { OrderStatus } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Minhas Compras — KKMarket' }

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending_payment: { label: 'Aguardando pagamento', cls: 'bg-zinc-700/60 text-zinc-300 border-zinc-700' },
  paid:            { label: 'Pago',                 cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  in_delivery:     { label: 'Em entrega',           cls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  delivered:       { label: 'Entregue',             cls: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  disputed:        { label: 'Em disputa',           cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
  refunded:        { label: 'Reembolsado',          cls: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  cancelled:       { label: 'Cancelado',            cls: 'bg-zinc-700/40 text-zinc-500 border-zinc-700/30' },
  completed:       { label: 'Concluído',            cls: 'bg-green-500/20 text-green-300 border-green-500/30' },
}

const PAYMENT_LABELS: Record<string, string> = {
  pix:            'PIX',
  credit_card:    'Cartão de crédito',
  boleto:         'Boleto',
  wallet_balance: 'Saldo',
  points:         'Pontos GG',
}

const TABS = [
  { value: 'all',             label: 'Todos' },
  { value: 'pending_payment', label: 'Pendentes' },
  { value: 'paid',            label: 'Pagos' },
  { value: 'in_delivery',     label: 'Em entrega' },
  { value: 'delivered',       label: 'Entregues' },
  { value: 'completed',       label: 'Concluídos' },
  { value: 'disputed',        label: 'Disputados' },
]

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function MinhasComprasPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const tab = sp.tab ?? 'all'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  let query = admin
    .from('orders')
    .select(`
      id, status, amount, payment_method, created_at,
      announcements!announcement_id (
        title, slug,
        announcement_images (url, is_cover, sort_order)
      ),
      profiles!seller_id (username, display_name)
    `)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (tab !== 'all') {
    query = query.eq('status', tab as OrderStatus)
  }

  const { data: orders } = await query

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Minhas Compras</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Acompanhe seus pedidos e histórico de compras</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1 w-fit">
          {TABS.map((t) => (
            <Link
              key={t.value}
              href={`/minhas-compras?tab=${t.value}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                tab === t.value
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Lista */}
        {!orders?.length ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <span className="text-5xl">🛍️</span>
            <p className="text-zinc-300 text-lg font-semibold">Nenhuma compra encontrada</p>
            <p className="text-zinc-500 text-sm">
              {tab === 'all'
                ? 'Você ainda não realizou nenhuma compra.'
                : `Nenhuma compra com status "${TABS.find((t) => t.value === tab)?.label}".`}
            </p>
            <Link
              href="/"
              className="mt-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
            >
              Explorar anúncios
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {orders.map((order) => {
              const ann = order.announcements as unknown as {
                title: string
                slug: string
                announcement_images: { url: string; is_cover: boolean; sort_order: number }[]
              } | null
              const seller = (order as unknown as Record<string, unknown>)['profiles!seller_id'] as {
                username: string
                display_name: string | null
              } | null
              const images = ann?.announcement_images ?? []
              const cover = images.find((i) => i.is_cover) ?? images[0]
              const statusCfg = STATUS_CONFIG[order.status] ?? { label: order.status, cls: 'bg-zinc-700 text-zinc-300 border-zinc-700' }

              return (
                <Link
                  key={order.id}
                  href={`/minhas-compras/${order.id}`}
                  className="flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-600 transition-colors group"
                >
                  {/* Thumbnail */}
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                    {cover?.url ? (
                      <Image src={cover.url} alt={ann?.title ?? ''} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl text-zinc-700">🎮</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate group-hover:text-violet-300 transition-colors">
                          {ann?.title ?? '—'}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Vendido por @{seller?.username ?? '—'}
                          {order.payment_method
                            ? ` · ${PAYMENT_LABELS[order.payment_method] ?? order.payment_method}`
                            : ''}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-3 py-0.5 text-xs font-medium ${statusCfg.cls}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-base font-bold text-white">{fmtBRL(Number(order.amount))}</p>
                      <p className="text-xs text-zinc-600">{fmtDate(order.created_at)}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
