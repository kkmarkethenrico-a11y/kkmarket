'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export function LanguageSelector({ currentLang }: { currentLang: string }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const toggleLang = () => {
    const newLang = currentLang === 'pt' ? 'en' : 'pt'
    document.cookie = `NEXT_LOCALE=${newLang}; path=/; max-age=31536000`
    router.refresh()
  }

  if (!mounted) return <div className="w-16 h-8" />

  return (
    <button 
      onClick={toggleLang}
      className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--gm-ink-faint)]/40 px-2 py-1.5 text-xs font-bold text-[var(--gm-ink-dim)] hover:border-[var(--gm-violet)]/60 hover:text-[var(--gm-ink)] transition-all uppercase"
      title="Mudar Idioma / Change Language"
    >
      <span className="material-symbols-outlined text-[16px]">language</span>
      {currentLang}
    </button>
  )
}
