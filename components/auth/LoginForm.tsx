'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  loginAction,
  forgotPasswordAction,
  signInWithOAuthAction,
  type LoginFormState,
} from '@/app/actions/auth'

// ─── Ícones inline (sem dep extra) ──────────────────────────────────────────
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

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#5865F2]" aria-hidden>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

// ─── Login Form ──────────────────────────────────────────────────────────────
export function LoginForm() {
  const router = useRouter()
  const [state, action, pending] = useActionState<LoginFormState, FormData>(loginAction, null)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotState, forgotAction, forgotPending] = useActionState<{ message?: string } | null, FormData>(
    forgotPasswordAction,
    null,
  )
  const [oauthLoading, setOauthLoading] = useState<'google' | 'discord' | null>(null)

  // Extrai prefixo de mensagem ("success:" | "error:")
  const forgotMsg = forgotState?.message
  const forgotIsSuccess = forgotMsg?.startsWith('success:')
  const forgotText = forgotMsg?.replace(/^(success:|error:)/, '')

  async function handleOAuth(provider: 'google' | 'discord') {
    setOauthLoading(provider)
    await signInWithOAuthAction(provider)
    setOauthLoading(null)
  }

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Entrar na sua conta
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Não tem conta?{' '}
          <Link href="/cadastro" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
            Cadastre-se grátis
          </Link>
        </p>
      </div>

      {/* OAuth Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          disabled={!!oauthLoading || pending}
          className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-zinc-700/60 hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {oauthLoading === 'google' ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          ) : (
            <GoogleIcon />
          )}
          Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuth('discord')}
          disabled={!!oauthLoading || pending}
          className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-zinc-700/60 hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {oauthLoading === 'discord' ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          ) : (
            <DiscordIcon />
          )}
          Discord
        </button>
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-zinc-900 px-3 text-zinc-500">ou continue com e-mail</span>
        </div>
      </div>

      {/* Email/Password Form */}
      {!showForgot ? (
        <form action={action} className="space-y-4">
          {/* E-mail */}
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-zinc-300 mb-1.5">
              E-mail
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="seu@email.com"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 aria-[invalid]:border-red-500"
              aria-invalid={!!state?.errors?.email}
              aria-describedby={state?.errors?.email ? 'login-email-error' : undefined}
            />
            {state?.errors?.email && (
              <p id="login-email-error" className="mt-1.5 text-xs text-red-400">
                {state.errors.email[0]}
              </p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Senha
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 aria-[invalid]:border-red-500"
              aria-invalid={!!state?.errors?.password}
              aria-describedby={state?.errors?.password ? 'login-password-error' : undefined}
            />
            {state?.errors?.password && (
              <p id="login-password-error" className="mt-1.5 text-xs text-red-400">
                {state.errors.password[0]}
              </p>
            )}
          </div>

          {/* Erro geral */}
          {state?.message && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {state.message}
            </div>
          )}

          {/* Esqueci a senha */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-xs text-zinc-400 hover:text-violet-400 transition-colors"
            >
              Esqueci minha senha
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={pending}
            className="relative w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            aria-busy={pending}
          >
            {pending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Entrando…
              </span>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      ) : (
        /* Forgot Password */
        <div>
          <button
            type="button"
            onClick={() => setShowForgot(false)}
            className="mb-4 flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            ← Voltar ao login
          </button>
          <h2 className="text-lg font-semibold text-white mb-1">Recuperar senha</h2>
          <p className="text-sm text-zinc-400 mb-4">
            Informe seu e-mail e enviaremos as instruções de recuperação.
          </p>
          <form action={forgotAction} className="space-y-4">
            <input
              name="email"
              type="email"
              required
              placeholder="seu@email.com"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />
            {forgotMsg && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  forgotIsSuccess
                    ? 'border-green-500/30 bg-green-500/10 text-green-400'
                    : 'border-red-500/30 bg-red-500/10 text-red-400'
                }`}
              >
                {forgotText}
              </div>
            )}
            <button
              type="submit"
              disabled={forgotPending}
              className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-violet-500 disabled:opacity-60"
            >
              {forgotPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Enviando…
                </span>
              ) : (
                'Enviar instruções'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
