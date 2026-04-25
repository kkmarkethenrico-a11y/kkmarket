'use client'

import { useTransition } from 'react'
import { signOutAction } from '@/app/actions/auth'

interface LogoutButtonProps {
  className?: string
  children?: React.ReactNode
}

/**
 * Botão de logout — client component.
 * Invoca a Server Action signOutAction via startTransition para manter
 * o pending state e exibir feedback visual.
 */
export function LogoutButton({ className, children }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await signOutAction()
    })
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className={className}
      aria-busy={isPending}
    >
      {isPending ? (
        <span className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
          Saindo…
        </span>
      ) : (
        children ?? 'Sair'
      )}
    </button>
  )
}
