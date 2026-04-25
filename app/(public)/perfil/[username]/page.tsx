import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ReputationBadge } from '@/components/profile/ReputationBadge'
import { ProfileReviewTabs } from '@/components/profile/ProfileReviewTabs'

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('display_name, username, bio')
    .eq('username', username)
    .single()
  if (!data) return { title: 'Perfil não encontrado' }
  return {
    title: `${data.display_name ?? data.username} | GameMarket`,
    description: data.bio ?? `Perfil de ${data.display_name ?? data.username} no GameMarket.`,
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id, username, display_name, avatar_url, bio, role, is_vip, created_at,
      user_stats!user_id (
        total_sales, total_purchases,
        reviews_positive, reviews_neutral, reviews_negative,
        avg_response_time_minutes
      ),
      user_validations ( type, status )
    `)
    .eq('username', username)
    .eq('status', 'active')
    .single()

  if (!profile) notFound()

  const stats = profile.user_stats as unknown as {
    total_sales: number
    total_purchases: number
    reviews_positive: number
    reviews_neutral: number
    reviews_negative: number
    avg_response_time_minutes: number | null
  } | null

  // Reviews iniciais para SSR (10 primeiras, todas as roles)
  const { data: initialReviews } = await supabase
    .from('order_reviews')
    .select(
      'id, reviewer_id, type, message, created_at, role, profiles!reviewer_id(username, display_name, avatar_url)',
    )
    .eq('reviewed_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const verifications = (profile.user_validations as { type: string; status: string }[] ?? [])
    .filter((v) => v.status === 'verified')
  const hasEmail    = verifications.some((v) => v.type === 'email')
  const hasPhone    = verifications.some((v) => v.type === 'phone')
  const hasIdentity = verifications.some((v) => ['identity_front', 'identity_back'].includes(v.type))

  const displayName = profile.display_name ?? profile.username
  const joinDate    = new Date(profile.created_at).toLocaleDateString('pt-BR', {
    month: 'long',
    year:  'numeric',
  })

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto max-w-4xl px-4 py-10">

        {/* ─── Header do perfil ─── */}
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="relative shrink-0">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={displayName}
                width={96}
                height={96}
                className="h-24 w-24 rounded-full object-cover ring-2 ring-zinc-700"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-800 text-2xl font-bold text-zinc-400 ring-2 ring-zinc-700">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
            {profile.is_vip && (
              <span className="absolute -right-1 -top-1 rounded-full bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-black">
                VIP
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{displayName}</h1>
              <span className="text-zinc-500">@{profile.username}</span>
            </div>

            {/* Verificações */}
            <div className="flex flex-wrap gap-2 text-xs">
              {hasEmail    && <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-blue-400">✉ Email</span>}
              {hasPhone    && <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-green-400">📱 Telefone</span>}
              {hasIdentity && <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-purple-400">🪪 Identidade</span>}
            </div>

            {profile.bio && (
              <p className="text-sm text-zinc-400">{profile.bio}</p>
            )}

            <p className="text-xs text-zinc-600">Membro desde {joinDate}</p>
          </div>

          {/* Stats rápidas */}
          <div className="flex shrink-0 flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm">
            <ReputationBadge
              reviewsPositive={stats?.reviews_positive ?? 0}
              reviewsNeutral={stats?.reviews_neutral ?? 0}
              reviewsNegative={stats?.reviews_negative ?? 0}
              variant="full"
            />
            <div className="mt-2 space-y-1 text-xs text-zinc-500">
              <div className="flex justify-between gap-6">
                <span>Vendas</span>
                <span className="text-zinc-300">{stats?.total_sales ?? 0}</span>
              </div>
              <div className="flex justify-between gap-6">
                <span>Compras</span>
                <span className="text-zinc-300">{stats?.total_purchases ?? 0}</span>
              </div>
              {stats?.avg_response_time_minutes != null && (
                <div className="flex justify-between gap-6">
                  <span>Resp. média</span>
                  <span className="text-zinc-300">
                    {stats.avg_response_time_minutes < 60
                      ? `${stats.avg_response_time_minutes}min`
                      : `${Math.round(stats.avg_response_time_minutes / 60)}h`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Tabs de avaliações ─── */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">Avaliações</h2>
          <ProfileReviewTabs
            userId={profile.id}
            initialReviews={(initialReviews ?? []) as unknown as Parameters<typeof ProfileReviewTabs>[0]['initialReviews']}
            reviewsPositive={stats?.reviews_positive ?? 0}
            reviewsNeutral={stats?.reviews_neutral ?? 0}
            reviewsNegative={stats?.reviews_negative ?? 0}
          />
        </section>
      </div>
    </main>
  )
}
