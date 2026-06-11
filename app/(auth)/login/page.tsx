import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Entrar — GameMarket',
  description: 'Entre na sua conta GameMarket para comprar e vender produtos digitais de games.',
}

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/painel')

  return (
    <div className="min-h-screen bg-[var(--gm-paper)] flex items-stretch">

      {/* ── Left panel: gaming art ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(34,211,238,0.04) 100%)' }}
      >
        {/* Background glow blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[var(--gm-violet)]/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[var(--gm-cyan)]/8 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--gm-violet)] text-[#1a1126] font-black text-xl shadow-[0_0_20px_rgba(167,139,250,0.5)]">
            ▶
          </div>
          <span className="text-2xl font-black tracking-tight text-[var(--gm-ink)]">
            Game<span className="text-[var(--gm-violet)]">Market</span>
          </span>
        </div>

        {/* Main copy */}
        <div className="relative">
          <div className="rank-chip cyan mb-6 inline-flex">◆ ACCESS GRANTED</div>
          <h2 className="text-5xl font-black leading-tight tracking-tight text-[var(--gm-ink)] mb-4">
            entre na{' '}
            <span className="text-[var(--gm-violet)]" style={{ textShadow: '0 0 24px rgba(167,139,250,0.5)' }}>
              arena
            </span>
          </h2>
          <p className="text-[var(--gm-ink-dim)] text-base max-w-xs mb-8">
            milhares de itens digitais, gold, contas e gift cards esperando por você
          </p>

          {/* Welcome bonus card */}
          <div className="rounded-xl border border-[var(--gm-violet)]/30 bg-[var(--gm-paper-2)] p-4 max-w-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--gm-ink-dim)] mb-3">
              🎁 PRÓXIMA RECOMPENSA
            </p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-[var(--gm-ink)]">Welcome Bonus</span>
              <span className="text-sm font-black text-[var(--gm-amber)]">+50 pts</span>
            </div>
            <div className="xp-bar">
              <div className="xp-bar-fill" style={{ width: '0%' }} />
            </div>
            <p className="text-[10px] text-[var(--gm-ink-faint)] mt-2">Faça login para desbloquear</p>
          </div>
        </div>

        {/* Trust icons */}
        <div className="relative flex items-center gap-6 text-xs text-[var(--gm-ink-dim)]">
          <span>🔒 Seguro</span>
          <span>⚡ Entrega rápida</span>
          <span>🏆 Programa de pontos</span>
        </div>

        {/* Decorative game controller */}
        <div className="absolute bottom-8 right-8 text-8xl opacity-[0.04] select-none pointer-events-none">
          🎮
        </div>
      </div>

      {/* ── Right panel: login form ──────────────────────────────────────── */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-16 bg-[var(--gm-paper)]">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
