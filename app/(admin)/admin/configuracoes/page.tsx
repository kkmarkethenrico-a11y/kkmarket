import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = { title: 'Configurações — Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || me.role !== 'admin') redirect('/')

  const admin = createAdminClient()

  // Platform stats as readonly reference
  const [
    { count: usersTotal },
    { count: annTotal },
    { count: ordersTotal },
    { count: ordersCompleted },
    { data: revenue },
  ] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('announcements').select('id', { count: 'exact', head: true }),
    admin.from('orders').select('id', { count: 'exact', head: true }),
    admin.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    admin.from('orders').select('platform_fee').eq('status', 'completed'),
  ])

  const totalRevenue = (revenue ?? []).reduce((s: number, o: any) => s + (o.platform_fee ?? 0), 0)
  const conversionRate = ordersTotal ? Math.round(((ordersCompleted ?? 0) / (ordersTotal ?? 1)) * 100) : 0

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <header>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Painel de controle da plataforma (somente admin).</p>
      </header>

      {/* Stats de saúde da plataforma */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-lg">Saúde da plataforma</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Usuários', value: (usersTotal ?? 0).toLocaleString('pt-BR') },
            { label: 'Anúncios', value: (annTotal ?? 0).toLocaleString('pt-BR') },
            { label: 'Pedidos', value: (ordersTotal ?? 0).toLocaleString('pt-BR') },
            { label: 'Taxa de conclusão', value: `${conversionRate}%` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border bg-muted/30 p-4 text-center">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Receita total (taxas): <strong className="text-green-400">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
        </p>
      </section>

      {/* Tarifas e policy */}
      <section className="rounded-xl border bg-card p-6 space-y-3">
        <h2 className="font-semibold text-lg">Tarifas atuais</h2>
        <p className="text-xs text-muted-foreground">Configuradas no código — altere em <code className="bg-muted px-1 rounded">lib/pagarme/</code> para modificar.</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-sm">
          {[
            { label: 'Taxa da plataforma', value: '10%' },
            { label: 'Saque normal', value: '2% + R$1,50' },
            { label: 'Saque turbo', value: '4%' },
            { label: 'Liberação padrão', value: '4 dias úteis' },
            { label: 'Pontos GG por compra', value: '1% do valor' },
            { label: 'Plano Silver', value: 'Grátis' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between rounded-lg border bg-muted/20 px-4 py-3">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Links de sistemas externos */}
      <section className="rounded-xl border bg-card p-6 space-y-3">
        <h2 className="font-semibold text-lg">Sistemas integrados</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
          {[
            { label: 'Supabase Dashboard', href: 'https://supabase.com/dashboard' },
            { label: 'Vercel Deployments', href: 'https://vercel.com/dashboard' },
            { label: 'Pagar.me Dashboard', href: 'https://dashboard.pagar.me' },
            { label: 'Resend Dashboard', href: 'https://resend.com/overview' },
            { label: 'MeiliSearch', href: process.env.NEXT_PUBLIC_MEILISEARCH_HOST ?? '#' },
          ].map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3 hover:bg-muted/40 transition-colors">
              <span>{label}</span>
              <span className="text-xs text-violet-400">↗</span>
            </a>
          ))}
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 space-y-3">
        <h2 className="font-semibold text-lg text-red-300">Zona de perigo</h2>
        <p className="text-sm text-muted-foreground">
          Ações destrutivas devem ser realizadas diretamente no Supabase Dashboard ou via CLI.
          Não há atalhos aqui para prevenir acidentes.
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li>Exclusão de usuários → Supabase Auth Dashboard</li>
          <li>Reset de dados → Supabase SQL Editor</li>
          <li>Alteração de RLS policies → Migrations</li>
        </ul>
      </section>
    </div>
  )
}
