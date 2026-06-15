import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChatWindow } from '@/components/chat/ChatWindow'

export const dynamic = 'force-dynamic'

interface ChatPageProps {
  params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id: orderId } = await params
  const supabase = await createClient()

  // 1. Verifica autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/chat/${orderId}`)

  // 2. Busca o pedido para garantir que o usuário participa dele
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, buyer_id, seller_id, status, announcements(title)')
    .eq('id', orderId)
    .single()

  if (error || !order) notFound()

  // 3. Valida permissão (só comprador ou vendedor)
  if (order.buyer_id !== user.id && order.seller_id !== user.id) {
    notFound()
  }

  // 4. Se o status for "Em entrega" (in_delivery) e o comprador abriu o chat, muda para "Entregue" (delivered)
  if (order.status === 'in_delivery' && user.id === order.buyer_id) {
    const admin = await import('@/lib/supabase/admin').then((m) => m.createAdminClient())
    await admin
      .from('orders')
      .update({ 
        status: 'delivered', 
        delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
    
    // Atualiza a variável local para refletir no chatEnabled
    order.status = 'delivered'
  }

  // 5. Determina se o chat está ativo (pago, em entrega, entregue, em disputa)
  const activeStatuses = ['paid', 'in_delivery', 'delivered', 'disputed']
  const chatEnabled = activeStatuses.includes(order.status)

  // Opcional: link para voltar dependendo se é comprador ou vendedor
  const backLink = user.id === order.buyer_id 
    ? `/minhas-compras/${orderId}` 
    : `/minhas-vendas/${orderId}`

  const title = (order.announcements as any)?.title || 'Pedido'

  return (
    <div className="min-h-[80vh] w-full max-w-4xl mx-auto p-4 flex flex-col gap-4">
      {/* Header do Chat */}
      <div className="flex items-center gap-3">
        <a href={backLink} className="text-[var(--gm-ink-faint)] hover:text-[var(--gm-ink)] transition-colors text-sm font-semibold">
          ← Voltar para o pedido
        </a>
      </div>

      <div className="rounded-xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-2)] p-4 flex flex-col gap-1">
        <h1 className="text-xl font-black text-[var(--gm-ink)]">Chat do Pedido</h1>
        <p className="text-sm text-[var(--gm-ink-dim)]">
          {title} <span className="text-[10px] bg-[var(--gm-paper-3)] px-2 py-0.5 rounded-md ml-2 font-mono">{order.id.split('-')[0].toUpperCase()}</span>
        </p>
      </div>

      {/* Janela de Chat Reutilizando o Componente */}
      <div className="flex-1 bg-[var(--gm-paper-2)] border border-[var(--gm-ink-faint)]/20 rounded-xl overflow-hidden shadow-sm">
        <ChatWindow 
          orderId={orderId} 
          currentUserId={user.id} 
          chatEnabled={chatEnabled} 
        />
      </div>
    </div>
  )
}
