import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PlatformTourHost } from '@/components/onboarding/PlatformTourHost'
import { CategoryAnnouncementsModal } from '@/components/marketplace/CategoryAnnouncementsModal'
import { getDictionary } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const dict = await getDictionary()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let serverShowTour = true
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('platform_tour_completed_at')
      .eq('id', user.id)
      .single()
    serverShowTour = !profile?.platform_tour_completed_at
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CategoryAnnouncementsModal />
      <PlatformTourHost
        dict={dict}
        serverShowTour={serverShowTour}
        isAuthenticated={!!user}
      />
    </div>
  )
}
