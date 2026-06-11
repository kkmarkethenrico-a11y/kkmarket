import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import WishlistClient from './WishlistClient'

export const metadata = {
  title: 'Lista de Desejos — GameMarket',
}

export default async function WishlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/wishlist')

  const admin = createAdminClient()
  
  const { data: wishlist } = await admin
    .from('wishlist')
    .select('id, announcements:announcement_id(id, title, unit_price, slug, announcement_images(url, is_cover, sort_order))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-[var(--gm-ink)]">Lista de Desejos</h1>
        <p className="mt-1 text-sm text-[var(--gm-ink-faint)]">
          Seus anúncios favoritados salvos para comprar depois.
        </p>
      </header>

      <WishlistClient items={wishlist as any} />
    </div>
  )
}