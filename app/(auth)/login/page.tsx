import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from '@/components/auth/LoginForm'
import { LanguageSelector } from '@/components/layout/LanguageSelector'
import { getDictionary, getLanguage } from '@/lib/i18n'

export async function generateMetadata() {
  const dict = await getDictionary()
  return {
    title: dict.auth.login.metaTitle,
    description: dict.auth.login.metaDescription,
  }
}

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/painel')

  const [dict, lang] = await Promise.all([getDictionary(), getLanguage()])
  const t = dict.auth.login

  return (
    <div className="min-h-screen bg-[var(--gm-paper)] flex items-stretch relative">

      <div className="absolute top-4 right-4 z-10 lg:top-6 lg:right-6">
        <LanguageSelector currentLang={lang} />
      </div>

      {/* ── Left panel: gaming art ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(255, 157, 0, 0.08) 0%, rgba(0, 162, 255, 0.04) 100%)' }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[var(--gm-violet)]/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[var(--gm-cyan)]/8 blur-3xl" />
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
          <div className="rank-chip cyan mb-6 inline-flex">{t.accessGranted}</div>
          <h2 className="text-5xl font-black leading-tight tracking-tight text-[var(--gm-ink)] mb-4">
            {t.panelTitle1}{' '}
            <span className="text-[var(--gm-violet)]" style={{ textShadow: '0 0 24px rgba(255, 157, 0, 0.5)' }}>
              {t.panelTitle2}
            </span>
          </h2>
          <p className="text-[var(--gm-ink-dim)] text-base max-w-xs mb-8">
            {t.panelDesc}
          </p>

          <div className="rounded-xl border border-[var(--gm-violet)]/30 bg-[var(--gm-paper-2)] p-4 max-w-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--gm-ink-dim)] mb-3">
              {t.nextReward}
            </p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-[var(--gm-ink)]">{t.dailyBonus}</span>
              <span className="text-sm font-black text-[var(--gm-amber)]">{t.dailyPoints}</span>
            </div>
            <div className="xp-bar">
              <div className="xp-bar-fill" style={{ width: '0%' }} />
            </div>
            <p className="text-[10px] text-[var(--gm-ink-faint)] mt-2">{t.loginToUnlock}</p>
          </div>
        </div>

        <div className="relative flex items-center gap-6 text-xs text-[var(--gm-ink-dim)]">
          <span>{t.secure}</span>
          <span>{t.fastDelivery}</span>
          <span>{t.pointsProgram}</span>
        </div>

        <div className="absolute bottom-8 right-8 text-8xl opacity-[0.04] select-none pointer-events-none">
          🎮
        </div>
      </div>

      {/* ── Right panel: login form ──────────────────────────────────────── */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-16 bg-[var(--gm-paper)]">
        <div className="w-full max-w-md">
          <LoginForm dict={dict} />
        </div>
      </div>
    </div>
  )
}
