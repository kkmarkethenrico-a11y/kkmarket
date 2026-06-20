'use client'

import { useActionState, useRef, useState } from 'react'
import Link from 'next/link'
import { registerAction, signInWithOAuthAction, type RegisterFormState } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

// O ícone do Discord foi removido

type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

function useUsernameAvailability() {
  const [status, setStatus] = useState<AvailabilityStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function check(value: string) {
    clearTimeout(timerRef.current)
    if (!value || value.length < 3) { setStatus('idle'); return }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) { setStatus('invalid'); return }
    setStatus('checking')
    timerRef.current = setTimeout(async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase.from('profiles').select('username')
          .eq('username', value.toLowerCase()).maybeSingle()
        setStatus(data ? 'taken' : 'available')
      } catch { setStatus('idle') }
    }, 500)
  }

  return { status, check }
}

const STEPS = ['conta', 'segurança', 'confirmar'] as const

const inputCls = "w-full rounded-lg border border-[var(--gm-ink-faint)]/50 bg-[var(--gm-paper-3)] px-4 py-3 text-sm text-[var(--gm-ink)] placeholder-[var(--gm-ink-faint)] outline-none transition-all focus:border-[var(--gm-violet)] focus:ring-2 focus:ring-[var(--gm-violet)]/20 aria-[invalid]:border-[var(--gm-rose)]"

export function RegisterForm() {
  const [state, action, pending] = useActionState<RegisterFormState, FormData>(registerAction, null)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'discord' | null>(null)
  const [step, setStep] = useState(0)
  const [fields, setFields] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const { status: usernameStatus, check: checkUsername } = useUsernameAvailability()

  const isSuccess = state?.message?.startsWith('success:')
  const successText = state?.message?.replace('success:', '')

  async function handleOAuth(provider: 'google' | 'discord') {
    setOauthLoading(provider)
    await signInWithOAuthAction(provider)
    setOauthLoading(null)
  }

  function canAdvanceStep0() {
    return fields.username.length >= 3 && fields.email.includes('@') &&
      usernameStatus === 'available'
  }

  function canAdvanceStep1() {
    return fields.password.length >= 8 && fields.password === fields.confirmPassword
  }

  const passwordStrength = (() => {
    const p = fields.password
    let score = 0
    if (p.length >= 8) score++
    if (/\d/.test(p)) score++
    if (/[!@#$%^&*]/.test(p)) score++
    if (p.length >= 12) score++
    return score
  })()

  const strengthColors = ['#fb7185', '#fbbf24', '#fbbf24', '#34d399', '#34d399']
  const strengthLabels = ['', 'fraca', 'média', 'boa', 'forte']

  const usernameHint: Record<AvailabilityStatus, { text: string; cls: string } | null> = {
    idle: null,
    invalid: { text: 'Apenas letras, números e _', cls: 'text-[var(--gm-amber)]' },
    checking: { text: 'Verificando…', cls: 'text-[var(--gm-ink-faint)]' },
    available: { text: '✓ Username disponível', cls: 'text-[var(--gm-green)]' },
    taken: { text: '✗ Username já em uso', cls: 'text-[var(--gm-rose)]' },
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--gm-green)]/15 border border-[var(--gm-green)]/30">
          <svg className="h-10 w-10 text-[var(--gm-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="rank-chip green inline-flex mb-4">🎉 CONTA CRIADA</div>
        <h2 className="text-2xl font-black text-[var(--gm-ink)] mb-2">Quase lá!</h2>
        <p className="text-[var(--gm-ink-dim)] text-sm mb-8">{successText}</p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-[var(--gm-violet)] px-8 py-3 text-sm font-black text-[#1a1126] transition-all hover:opacity-90 gm-glow"
        >
          Ir para o login →
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-[var(--gm-ink)]">criar conta</h1>
        <p className="mt-2 text-sm text-[var(--gm-ink-dim)]">
          já tem conta?{' '}
          <Link href="/login" className="text-[var(--gm-violet)] hover:text-[var(--gm-cyan)] font-semibold transition-colors">
            entrar
          </Link>
        </p>
      </div>

      {/* OAuth on step 0 only */}
      {step === 0 && (
        <>
          <div className="mb-6">
            <button type="button" onClick={() => handleOAuth('google')} disabled={!!oauthLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--gm-ink-faint)]/50 bg-[var(--gm-paper-3)] px-4 py-3 text-sm font-semibold text-[var(--gm-ink)] transition-all hover:border-[var(--gm-violet)]/50 disabled:opacity-50">
              {oauthLoading === 'google' ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--gm-ink-faint)] border-t-[var(--gm-violet)]" /> : <GoogleIcon />}
              Google
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--gm-ink-faint)]/30" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-widest">
              <span className="bg-[var(--gm-paper)] px-3 text-[var(--gm-ink-faint)]">ou cadastre com e-mail</span>
            </div>
          </div>
        </>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-black transition-all ${
              i < step
                ? 'border-[var(--gm-violet)] bg-[var(--gm-violet)] text-[#1a1126]'
                : i === step
                  ? 'border-[var(--gm-violet)] text-[var(--gm-violet)]'
                  : 'border-[var(--gm-ink-faint)]/40 text-[var(--gm-ink-faint)]'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-semibold uppercase tracking-wide ${
              i <= step ? 'text-[var(--gm-ink)]' : 'text-[var(--gm-ink-faint)]'
            }`}>{label}</span>
            {i < STEPS.length - 1 && (
              <span className="text-[var(--gm-ink-faint)]/40 mx-1 text-xs">─</span>
            )}
          </div>
        ))}
      </div>

      <form action={action} className="space-y-4">
        {/* Always include hidden fields with collected values */}
        <input type="hidden" name="username" value={fields.username} />
        <input type="hidden" name="email" value={fields.email} />
        <input type="hidden" name="password" value={fields.password} />
        <input type="hidden" name="confirmPassword" value={fields.confirmPassword} />

        {/* ── Step 0: Conta ──────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="rank-chip inline-flex mb-2">STEP 1 · CONTA</div>
            <div>
              <label htmlFor="reg-username" className="block text-xs font-bold uppercase tracking-wide text-[var(--gm-ink-dim)] mb-1.5">
                @ Username
              </label>
              <input
                id="reg-username"
                type="text"
                autoComplete="username"
                maxLength={30}
                placeholder="seu_username"
                value={fields.username}
                onChange={(e) => { setFields(f => ({ ...f, username: e.target.value })); checkUsername(e.target.value) }}
                className={inputCls}
                aria-invalid={usernameStatus === 'taken' || usernameStatus === 'invalid'}
              />
              {usernameHint[usernameStatus] && (
                <p className={`mt-1.5 text-xs ${usernameHint[usernameStatus]!.cls}`}>
                  {usernameHint[usernameStatus]!.text}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-bold uppercase tracking-wide text-[var(--gm-ink-dim)] mb-1.5">
                E-mail
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="player@gamemarket.app"
                value={fields.email}
                onChange={(e) => setFields(f => ({ ...f, email: e.target.value }))}
                className={inputCls}
              />
              {state?.errors?.email && (
                <p className="mt-1.5 text-xs text-[var(--gm-rose)]">{state.errors.email[0]}</p>
              )}
            </div>

            <button
              type="button"
              disabled={!canAdvanceStep0()}
              onClick={() => setStep(1)}
              className="w-full rounded-lg bg-[var(--gm-violet)] px-4 py-3 text-sm font-black text-[#1a1126] transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              continuar →
            </button>
          </div>
        )}

        {/* ── Step 1: Segurança ──────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="rank-chip inline-flex mb-2">STEP 2 · SEGURANÇA</div>
            <div>
              <label htmlFor="reg-password" className="block text-xs font-bold uppercase tracking-wide text-[var(--gm-ink-dim)] mb-1.5">
                Senha
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                placeholder="Mín. 8 caracteres"
                value={fields.password}
                onChange={(e) => setFields(f => ({ ...f, password: e.target.value }))}
                className={inputCls}
              />
              {fields.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all" style={{
                        background: i <= passwordStrength ? strengthColors[passwordStrength] : 'var(--gm-ink-faint)',
                        opacity: i <= passwordStrength ? 1 : 0.3
                      }} />
                    ))}
                  </div>
                  {passwordStrength > 0 && (
                    <p className="text-xs" style={{ color: strengthColors[passwordStrength] }}>
                      Senha {strengthLabels[passwordStrength]}
                    </p>
                  )}
                </div>
              )}
              {state?.errors?.password && (
                <p className="mt-1.5 text-xs text-[var(--gm-rose)]">{state.errors.password[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-confirm" className="block text-xs font-bold uppercase tracking-wide text-[var(--gm-ink-dim)] mb-1.5">
                Confirmar Senha
              </label>
              <input
                id="reg-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Repita a senha"
                value={fields.confirmPassword}
                onChange={(e) => setFields(f => ({ ...f, confirmPassword: e.target.value }))}
                className={inputCls}
                aria-invalid={fields.confirmPassword.length > 0 && fields.password !== fields.confirmPassword}
              />
              {fields.confirmPassword.length > 0 && fields.password !== fields.confirmPassword && (
                <p className="mt-1.5 text-xs text-[var(--gm-rose)]">As senhas não coincidem</p>
              )}
              {fields.confirmPassword.length > 0 && fields.password === fields.confirmPassword && (
                <p className="mt-1.5 text-xs text-[var(--gm-green)]">✓ Senhas coincidem</p>
              )}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(0)}
                className="flex-1 rounded-lg border border-[var(--gm-ink-faint)]/40 px-4 py-3 text-sm font-semibold text-[var(--gm-ink-dim)] hover:border-[var(--gm-violet)]/50 hover:text-[var(--gm-ink)] transition-all">
                ← voltar
              </button>
              <button type="button" disabled={!canAdvanceStep1()} onClick={() => setStep(2)}
                className="flex-1 rounded-lg bg-[var(--gm-violet)] px-4 py-3 text-sm font-black text-[#1a1126] transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
                continuar →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Confirmar ──────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="rank-chip inline-flex mb-2">STEP 3 · CONFIRMAR</div>

            {/* Summary */}
            <div className="rounded-xl border border-[var(--gm-ink-faint)]/30 bg-[var(--gm-paper-3)] p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--gm-ink-dim)]">Username</span>
                <span className="font-bold text-[var(--gm-violet)]">@{fields.username}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--gm-ink-dim)]">E-mail</span>
                <span className="font-semibold text-[var(--gm-ink)]">{fields.email}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--gm-ink-dim)]">Senha</span>
                <span className="font-semibold text-[var(--gm-green)]">✓ configurada</span>
              </div>
            </div>

            {/* Welcome bonus */}
            <div className="rounded-xl border border-[var(--gm-amber)]/30 bg-[var(--gm-amber)]/5 p-3 flex items-center gap-3">
              <span className="text-2xl">🎁</span>
              <div>
                <p className="text-xs font-bold text-[var(--gm-amber)] uppercase tracking-wide">Bônus de Login Diário</p>
                <p className="text-sm text-[var(--gm-ink)]">+10 pts ao confirmar o e-mail e logar</p>
              </div>
            </div>

            {state?.message && !isSuccess && (
              <div className="rounded-lg border border-[var(--gm-rose)]/30 bg-[var(--gm-rose)]/10 px-4 py-3 text-sm text-[var(--gm-rose)]">
                {state.message}
              </div>
            )}

            <p className="text-xs text-[var(--gm-ink-faint)]">
              Ao criar conta, você concorda com nossos{' '}
              <Link href="/termos" className="text-[var(--gm-violet)] hover:underline">Termos</Link>{' '}
              e{' '}
              <Link href="/privacidade" className="text-[var(--gm-violet)] hover:underline">Política de Privacidade</Link>.
            </p>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 rounded-lg border border-[var(--gm-ink-faint)]/40 px-4 py-3 text-sm font-semibold text-[var(--gm-ink-dim)] hover:border-[var(--gm-violet)]/50 hover:text-[var(--gm-ink)] transition-all">
                ← voltar
              </button>
              <button type="submit" disabled={pending}
                className="flex-1 rounded-lg bg-[var(--gm-violet)] px-4 py-3 text-sm font-black text-[#1a1126] transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 gm-glow"
                aria-busy={pending}>
                {pending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1a1126]/30 border-t-[#1a1126]" />
                    Criando…
                  </span>
                ) : (
                  'criar minha conta →'
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
