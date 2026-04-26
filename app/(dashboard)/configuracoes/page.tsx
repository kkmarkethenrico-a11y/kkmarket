import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './ProfileForm'

export const metadata = { title: 'Configurações — GameMarket' }
export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/configuracoes')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, full_name, cpf, phone, birth_date, bio, avatar_url, role, seller_status, created_at')
    .eq('id', user.id)
    .single()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Configurações da conta</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Atualize seus dados pessoais. Eles são usados em compras, vendas e identificação fiscal.
        </p>
      </header>

      <section className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Field label="E-mail" value={user.email ?? '—'} />
          <Field label="Username" value={`@${profile?.username ?? ''}`} />
          <Field label="Tipo de conta" value={profile?.role === 'admin' ? 'Admin' : profile?.role === 'moderator' ? 'Moderador' : 'Cliente'} />
          <Field label="Vendedor" value={sellerLabel(profile?.seller_status)} />
        </div>
      </section>

      <ProfileForm
        defaults={{
          display_name: profile?.display_name ?? '',
          full_name:    profile?.full_name    ?? '',
          cpf:          profile?.cpf          ?? '',
          phone:        profile?.phone        ?? '',
          birth_date:   profile?.birth_date   ?? '',
          bio:          profile?.bio          ?? '',
          avatar_url:   profile?.avatar_url   ?? '',
        }}
      />
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-zinc-200">{value}</p>
    </div>
  )
}

function sellerLabel(s?: string | null): string {
  if (s === 'approved') return 'Aprovado'
  if (s === 'pending')  return 'Em análise'
  if (s === 'rejected') return 'Rejeitado'
  return 'Não qualificado'
}