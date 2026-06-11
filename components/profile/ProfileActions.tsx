'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export function ProfileActions({ username }: { username: string }) {
  const [following, setFollowing] = useState(false)

  const handleFollow = () => {
    setFollowing(!following)
    if (!following) {
      toast.success(`Você começou a seguir ${username}!`)
    } else {
      toast.info(`Você deixou de seguir ${username}.`)
    }
  }

  const handleChat = () => {
    toast.info('O chat direto está em desenvolvimento. Por enquanto, utilize o chat do pedido após realizar uma compra.')
  }

  return (
    <div className="flex gap-2">
      <button 
        onClick={handleFollow}
        className={`flex-1 rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
          following 
            ? 'border-[var(--gm-violet)] bg-[var(--gm-violet)]/10 text-[var(--gm-violet)]' 
            : 'border-[var(--gm-ink-faint)]/40 text-[var(--gm-ink-dim)] hover:border-[var(--gm-violet)]/50 hover:text-[var(--gm-ink)]'
        }`}
      >
        {following ? '♥ seguindo' : '♡ seguir'}
      </button>
      <button 
        onClick={handleChat}
        className="flex-1 rounded-lg bg-[var(--gm-violet)] px-3 py-2 text-xs font-black text-[#1a1126] hover:opacity-90 transition-all gm-glow"
      >
        💬 chat
      </button>
    </div>
  )
}
