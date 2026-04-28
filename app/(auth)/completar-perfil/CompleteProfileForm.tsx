'use client'

import { useActionState, useRef, useState } from 'react'
import { completeProfileAction, type CompleteProfileState } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'

// ─── Username availability checker (reutilizado do RegisterForm) ──────────────
type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

function useUsernameAvailability() {
  const [status, setStatus] = useState<AvailabilityStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function check(value: string) {
    clearTimeout(timerRef.current)

    if (!value || value.length < 3) {
      setStatus('idle')
      return
    }

    if (!/^[a-z0-9_]+$/i.test(value)) {
      setStatus('invalid')
      return
    }

    setStatus('checking')
    timerRef.current = setTimeout(async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', value.toLowerCase())
          .maybeSingle()
        setStatus(data ? 'taken' : 'available')
      } catch {
        setStatus('idle')
      }
    }, 500)
  }

  return { status, check }
}

const statusMeta: Record<AvailabilityStatus, { text: string; color: string } | null> = {
  idle:      null,
  checking:  { text: 'Verificando…',      color: 'text-zinc-500' },
  available: { text: '✓ Disponível',       color: 'text-green-400' },
  taken:     { text: '✗ Já está em uso',   color: 'text-red-400' },
  invalid:   { text: 'Apenas letras, números e _', color: 'text-amber-400' },
}

// ─── Form ─────────────────────────────────────────────────────────────────────
export function CompleteProfileForm({
  suggestedUsername,
  displayName,
  avatarUrl,
}: {
  suggestedUsername: string
  displayName: string | null
  avatarUrl: string | null
}) {
  const [state, action, pending] = useActionState<CompleteProfileState, FormData>(
    completeProfileAction,
    null,
  )
  const { status: usernameStatus, check: checkUsername } = useUsernameAvailability()
  const [username, setUsername] = useState(suggestedUsername)

  const canSubmit = !pending && usernameStatus !== 'taken' && usernameStatus !== 'invalid'

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="mb-8 text-center">
        {avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName ?? 'avatar'}
            className="mx-auto mb-4 h-16 w-16 rounded-full object-cover ring-2 ring-violet-500/40"
          />
        )}
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Quase lá! 👋
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          {displayName ? `Olá, ${displayName}! ` : ''}
          Escolha um username para sua conta.
        </p>
      </div>

      <form action={action} className="flex flex-col gap-4">
        {/* Erro geral */}
        {state?.error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {state.error}
          </div>
        )}

        {/* Campo username */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="username" className="text-sm font-medium text-zinc-300">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
              @
            </span>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              autoFocus
              maxLength={30}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                checkUsername(e.target.value)
              }}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 py-3 pl-7 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
              placeholder="seu_username"
            />
          </div>

          {/* Status de disponibilidade */}
          {usernameStatus !== 'idle' && statusMeta[usernameStatus] && (
            <p className={`text-xs ${statusMeta[usernameStatus]!.color}`}>
              {statusMeta[usernameStatus]!.text}
            </p>
          )}

          <p className="text-xs text-zinc-600">
            3–30 caracteres. Letras, números e underscore (_) apenas.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-4 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition-all hover:bg-violet-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            'Confirmar e entrar'
          )}
        </button>
      </form>
    </div>
  )
}
