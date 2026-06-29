'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AnnouncementCard } from './AnnouncementCard'
import type { Category, AnnouncementWithRelations } from '@/types'

export function CategoryAnnouncementsModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [announcements, setAnnouncements] = useState<AnnouncementWithRelations[]>([])

  useEffect(() => {
    const handleOpen = async (e: Event) => {
      const customEvent = e as CustomEvent<{ slug: string }>
      const slug = customEvent.detail?.slug
      if (!slug) return

      setIsOpen(true)
      setLoading(true)
      setAnnouncements([])
      setCategoryName(slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '))

      try {
        const supabase = createClient()

        // 1. Fetch category details by slug
        const { data: cat } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', slug)
          .eq('status', true)
          .single()

        if (cat) {
          setCategoryName(cat.name)

          // 2. Fetch subcategories if this is a parent category
          const { data: subcats } = await supabase
            .from('categories')
            .select('id')
            .eq('parent_id', cat.id)
            .eq('status', true)

          const catIds = [cat.id, ...(subcats ?? []).map(s => s.id)]

          // 3. Fetch announcements
          const { data: rawAnn } = await supabase
            .from('announcements')
            .select(`
              id, user_id, category_id, title, slug, description,
              model, plan, unit_price, stock_quantity,
              has_auto_delivery, is_vip, sale_count, view_count,
              status, created_at, updated_at,
              profiles!user_id (
                username, display_name, avatar_url, last_seen_at
              ),
              announcement_images (
                url, is_cover, sort_order
              )
            `)
            .in('category_id', catIds)
            .eq('status', 'active')
            .order('plan', { ascending: false })
            .order('created_at', { ascending: false })

          setAnnouncements((rawAnn ?? []) as unknown as AnnouncementWithRelations[])
        }
      } catch (err) {
        console.error('Error loading category announcements:', err)
      } finally {
        setLoading(false)
      }
    }

    const handleGlobalClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (anchor) {
        const href = anchor.getAttribute('href')
        if (href && (href.startsWith('/categoria/') || href.startsWith('/categoria?'))) {
          // Intercept category page navigation to display as a modal
          const parts = href.split('?')[0].split('/').filter(Boolean)
          // parts = ['categoria', 'slug'] or ['categoria', 'parent-slug', 'sub-slug']
          if (parts.length >= 2) {
            e.preventDefault()
            const slug = parts[parts.length - 1]
            window.dispatchEvent(new CustomEvent('open-category-modal', { detail: { slug } }))
          }
        }
      }
    }

    window.addEventListener('open-category-modal', handleOpen)
    document.addEventListener('click', handleGlobalClick)

    return () => {
      window.removeEventListener('open-category-modal', handleOpen)
      document.removeEventListener('click', handleGlobalClick)
    }
  }, [])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        onClick={() => setIsOpen(false)}
        className="absolute inset-0 cursor-pointer"
      />
      
      <div className="relative w-full max-w-4xl bg-surface-container border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-5 bg-surface-container-high/40">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{categoryName}</h2>
            <p className="text-xs text-[var(--gm-ink-faint)] mt-0.5">
              {loading ? 'Carregando anúncios...' : `${announcements.length} anúncio(s) encontrado(s)`}
            </p>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg text-[var(--gm-ink-dim)] hover:text-white hover:bg-white/5 transition-all cursor-pointer focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--gm-violet)] border-t-transparent" />
              <span className="text-sm text-[var(--gm-ink-dim)]">Buscando anúncios...</span>
            </div>
          ) : announcements.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {announcements.map((ann) => (
                <div key={ann.id} onClick={() => setIsOpen(false)}>
                  <AnnouncementCard ann={ann} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-20 px-4 border border-dashed border-white/5 rounded-xl bg-white/2">
              <span className="text-5xl mb-4">🎮</span>
              <h3 className="text-lg font-bold text-white">Nada disponível</h3>
              <p className="text-sm text-[var(--gm-ink-dim)] mt-1 max-w-sm">
                Esta categoria não possui anúncios ativos no momento.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
