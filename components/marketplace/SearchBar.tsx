'use client'

import { useRouter } from 'next/navigation'
import { useRef, useTransition } from 'react'
import { Search } from 'lucide-react'

export function SearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = inputRef.current?.value.trim() ?? ''
    const url = q ? `/buscar?q=${encodeURIComponent(q)}` : '/buscar'
    startTransition(() => { router.push(url) })
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Buscar por título, jogo, item…"
        className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-28 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
      />
      <button
        type="submit"
        disabled={isPending}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? '…' : 'Buscar'}
      </button>
    </form>
  )
}
