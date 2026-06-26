import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { LanguageSelector } from '@/components/layout/LanguageSelector'
import { getDictionary, getLanguage } from '@/lib/i18n'

export async function generateMetadata() {
  const dict = await getDictionary()
  return {
    title: dict.auth.register.metaTitle,
    description: dict.auth.register.metaDescription,
  }
}

const BENEFIT_ICONS = ['🎁', '⚡', '🏆', '💰']
const BENEFIT_COLORS = ['var(--gm-amber)', 'var(--gm-cyan)', 'var(--gm-violet)', 'var(--gm-green)']

export default async function CadastroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/')

  const [dict, lang] = await Promise.all([getDictionary(), getLanguage()])
  const t = dict.auth.register

  return (
    <div className="min-h-screen bg-[var(--gm-paper)] flex items-stretch relative">

      <div className="absolute top-4 right-4 z-10 lg:top-6 lg:right-6">
        <LanguageSelector currentLang={lang} />
      </div>

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
          <div className="rank-chip mb-6 inline-flex">{t.panelBadge}</div>
          <h2 className="text-5xl font-black leading-tight tracking-tight text-[var(--gm-ink)] mb-4">
            {t.panelTitle1}{' '}
            <span className="text-[var(--gm-cyan)]" style={{ textShadow: '0 0 24px rgba(34,211,238,0.4)' }}>
              {t.panelTitle2}
            </span>
          </h2>
          <p className="text-[var(--gm-ink-dim)] text-base max-w-xs mb-8">
            {t.panelDesc}
          </p>

          <div className="space-y-3">
            {t.benefits.map((text: string, i: number) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-xl">{BENEFIT_ICONS[i]}</span>
                <span className="text-sm font-semibold" style={{ color: BENEFIT_COLORS[i] }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-6 text-xs text-[var(--gm-ink-dim)]">
          <span>{t.trustSecure}</span>
          <span>{t.trustFree}</span>
          <span>{t.trustNoCard}</span>
        </div>

        <div className="absolute bottom-8 right-8 text-8xl opacity-[0.04] select-none pointer-events-none">
          🕹️
        </div>
      </div>

      {/* ── Right panel: register form ───────────────────────────────── */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-16 bg-[var(--gm-paper)]">
        <div className="w-full max-w-md">
          <RegisterForm dict={dict} />
        </div>
      </div>
    </div>
  )
}
