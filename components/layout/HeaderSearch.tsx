'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

const mockResults = {
  announcements: [
    { id: '1', title: 'Conta Prata - Nível 30', game: 'League of Legends', price: 50.0 },
    { id: '2', title: 'Skin Mítica - Dragon', game: 'Valorant', price: 120.0 },
  ],
  users: [
    { id: '1', username: 'pro_seller99', avatar: null },
  ],
  categories: [
    { id: '1', name: 'Free Fire', slug: 'free-fire' },
  ],
}

export function HeaderSearch() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mock search delay
  useEffect(() => {
    if (query.length >= 3) {
      setIsLoading(true)
      const timer = setTimeout(() => {
        setIsLoading(false)
        setIsOpen(true)
      }, 400)
      return () => clearTimeout(timer)
    } else {
      setIsOpen(false)
    }
  }, [query])

  return (
    <div className="relative w-full max-w-md" ref={containerRef}>
      <div className="relative flex items-center">
        {isLoading ? (
          <Loader2 className="absolute left-3 h-4 w-4 text-zinc-500 animate-spin" />
        ) : (
          <Search className="absolute left-3 h-4 w-4 text-zinc-500" />
        )}
        <Input
          type="search"
          placeholder="Buscar anúncios, jogos, usuários..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.length >= 3) setIsOpen(true)
          }}
          className="w-full bg-zinc-900/50 pl-10 pr-4 border-zinc-800 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 rounded-full text-sm transition-all"
        />
      </div>

      {isOpen && query.length >= 3 && (
        <div className="absolute top-full mt-2 w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/95 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 z-50">
          <div className="flex max-h-[70vh] flex-col overflow-y-auto p-2">
            
            {/* Announcements */}
            <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              Anúncios
            </div>
            <div className="mb-2 flex flex-col">
              {mockResults.announcements.map((item) => (
                <Link
                  key={item.id}
                  href={`/anuncio/${item.id}`}
                  className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-zinc-800/60 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-200">{item.title}</span>
                    <span className="text-xs text-zinc-500">{item.game}</span>
                  </div>
                  <span className="text-sm font-bold text-green-400">
                    R$ {item.price.toFixed(2)}
                  </span>
                </Link>
              ))}
            </div>

            {/* Categories */}
            <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-widest border-t border-zinc-800/50 pt-3">
              Categorias
            </div>
            <div className="mb-2 flex gap-2 px-2 py-1 flex-wrap">
              {mockResults.categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categoria/${cat.slug}`}
                  onClick={() => setIsOpen(false)}
                >
                  <Badge variant="secondary" className="hover:bg-violet-600/20 hover:text-violet-400 transition-colors border-zinc-800 text-zinc-400">
                    {cat.name}
                  </Badge>
                </Link>
              ))}
            </div>

            {/* Users */}
            <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-widest border-t border-zinc-800/50 pt-3">
              Vendedores
            </div>
            <div className="flex flex-col mb-1">
              {mockResults.users.map((user) => (
                <Link
                  key={user.id}
                  href={`/perfil/${user.username}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-zinc-800/60 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.avatar || ''} />
                    <AvatarFallback className="text-[10px] bg-violet-600">
                      {user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-zinc-300">@{user.username}</span>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Footer Action */}
          <Link
            href={`/busca?q=${encodeURIComponent(query)}`}
            onClick={() => setIsOpen(false)}
            className="block border-t border-zinc-800 bg-zinc-900/50 p-3 text-center text-xs font-medium text-violet-400 hover:text-violet-300 hover:bg-zinc-900 transition-colors"
          >
            Ver todos os resultados para &quot;{query}&quot;
          </Link>
        </div>
      )}
    </div>
  )
}
