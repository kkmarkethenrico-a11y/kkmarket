import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata = {
  title: 'Criar conta — GameMarket',
  description: 'Crie sua conta GameMarket grátis e comece a comprar e vender produtos digitais de games.',
}

export default async function CadastroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/painel')

  return (
    <div className="min-h-screen bg-[var(--gm-paper)] flex items-stretch">

      {/* ── Left panel ────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(0, 162, 255, 0.06) 0%, rgba(255, 157, 0, 0.08) 100%)' }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[var(--gm-cyan)]/8 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[var(--gm-violet)]/8 blur-3xl" />
        </div>

        <div className="relative flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="KKmarket Logo"
            width={130}
            height={38}
            priority
            className="h-9 w-auto object-contain"
          />
        </div>

        <div className="relative">
          <div className="rank-chip mb-6 inline-flex">🎮 JUNTE-SE À ARENA</div>
          <h2 className="text-5xl font-black leading-tight tracking-tight text-[var(--gm-ink)] mb-4">
            monte seu{' '}
            <span className="text-[var(--gm-cyan)]" style={{ textShadow: '0 0 24px rgba(34,211,238,0.4)' }}>
              avatar
            </span>
          </h2>
          <p className="text-[var(--gm-ink-dim)] text-base max-w-xs mb-8">
            crie sua conta, ganhe pontos e conquiste sua posição no ranking
          </p>

          {/* Benefit list */}
          <div className="space-y-3">
            {[
              { icon: '🎁', text: '+50 pts de boas-vindas ao confirmar e-mail', color: 'var(--gm-amber)' },
              { icon: '⚡', text: 'Compre com entrega automática imediata', color: 'var(--gm-cyan)' },
              { icon: '🏆', text: 'Suba no ranking e desbloqueie benefícios', color: 'var(--gm-violet)' },
              { icon: '💰', text: 'Venda seus itens para milhares de gamers', color: 'var(--gm-green)' },
            ].map(({ icon, text, color }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <span className="text-sm font-semibold" style={{ color }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-6 text-xs text-[var(--gm-ink-dim)]">
          <span>🔒 100% seguro</span>
          <span>✓ Grátis para criar</span>
          <span>🎯 Sem cartão</span>
        </div>

        <div className="absolute bottom-8 right-8 text-8xl opacity-[0.04] select-none pointer-events-none">
          🕹️
        </div>
      </div>

      {/* ── Right panel: register form ───────────────────────────────── */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-16 bg-[var(--gm-paper)]">
        <div className="w-full max-w-md">
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}
