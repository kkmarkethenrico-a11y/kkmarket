import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SellerApplicationForm } from './SellerApplicationForm'

export const metadata = {
  title: 'Qualificar para vender — GameMarket',
  description: 'Envie seus documentos para se qualificar como vendedor.',
}

export default async function VerificacaoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/verificacao')

  const { data: profile } = await supabase
    .from('profiles')
    .select('seller_status, seller_applied_at, seller_approved_at, seller_rejection_reason')
    .eq('id', user.id)
    .single()

  const status: string = profile?.seller_status ?? 'disabled'

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Qualificação para vendedor</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Para vender produtos digitais na GameMarket, é necessário verificar sua identidade.
          Envie os documentos abaixo. A análise é feita em até 48h.
        </p>
      </header>

      <StatusBadge status={status} />

      {status === 'rejected' && profile?.seller_rejection_reason && (
        <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-300">
          <strong className="block mb-1 text-red-200">Motivo da rejeição:</strong>
          {profile.seller_rejection_reason}
        </div>
      )}

      {(status === 'disabled' || status === 'rejected') && (
        <div className="mt-6">
          <SellerApplicationForm />
        </div>
      )}

      {status === 'pending' && (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <p className="text-sm text-amber-300">
            ⏳ Sua solicitação está sendo analisada pelo nosso time. Você receberá um e-mail assim que tivermos um retorno.
          </p>
        </div>
      )}

      {status === 'approved' && (
        <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/5 p-6 text-center">
          <p className="text-sm text-green-300">
            ✅ Sua conta está qualificada como vendedor. Você já pode anunciar produtos.
          </p>
          <a
            href="/meus-anuncios/novo"
            className="mt-4 inline-flex rounded-full bg-violet-600 px-6 py-2 text-sm font-bold text-white hover:bg-violet-500 transition-colors"
          >
            Criar primeiro anúncio
          </a>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    disabled: { label: 'Não qualificado',   cls: 'bg-zinc-800 text-zinc-300' },
    pending:  { label: 'Em análise',         cls: 'bg-amber-500/20 text-amber-300' },
    approved: { label: 'Aprovado',           cls: 'bg-green-500/20 text-green-300' },
    rejected: { label: 'Rejeitado',          cls: 'bg-red-500/20 text-red-300' },
  }
  const m = map[status] ?? map.disabled
  return (
    <div className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${m.cls}`}>
      {m.label}
    </div>
  )
}
