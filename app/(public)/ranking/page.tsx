import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Trophy, Star, Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Ranking de Vendedores — KKMarket',
  description: 'Conheça os vendedores mais bem avaliados da KKMarket.',
}

// ─── Score formula (igual à migration) ───────────────────────────────────────
function calcScore(pos: number, neu: number, neg: number): number | null {
  const total = pos + neu + neg
  if (total < 3) return null
  return Math.round(((pos * 100 + neu * 50) / total) * 100) / 100
}

function fmtScore(score: number) {
  return score.toFixed(1)
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(score, 100)
  const color =
    pct >= 90 ? 'bg-emerald-500' :
    pct >= 75 ? 'bg-blue-500'    :
    pct >= 50 ? 'bg-amber-500'   : 'bg-red-500'
  return (
    <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>
  if (rank === 2) return <span className="text-xl">🥈</span>
  if (rank === 3) return <span className="text-xl">🥉</span>
  return <span className="text-sm font-mono text-zinc-500 w-6 text-center">#{rank}</span>
}

type Seller = {
  user_id:          string
  username:         string
  display_name:     string | null
  avatar_url:       string | null
  is_vip:           boolean
  total_sales:      number
  reviews_positive: number
  reviews_neutral:  number
  reviews_negative: number
  total_reviews:    number
  reputation_score: number | null
  avg_response_time_minutes: number | null
}

export default async function RankingPage() {
  const supabase = await createClient()

  // Tenta usar a view seller_ranking (criada na migration 015).
  // Se a migration ainda não foi aplicada, cai no fallback inline.
  const { data: ranked, error } = await supabase
    .from('seller_ranking')
    .select('*')
    .order('rank', { ascending: true })
    .limit(100)

  // Fallback: calcula ranking inline sem a view
  const sellers: Seller[] = ranked ?? []
  let fallbackSellers: Seller[] = []

  if (error || !ranked) {
    const { data: rawStats } = await supabase
      .from('user_stats')
      .select(`
        user_id, total_sales, reviews_positive, reviews_neutral, reviews_negative,
        avg_response_time_minutes,
        profiles!user_id (id, username, display_name, avatar_url, is_vip, status, seller_status)
      `)
      .gte('reviews_positive', 1)
      .limit(200)

    fallbackSellers = ((rawStats ?? []) as unknown as {
      user_id: string
      total_sales: number
      reviews_positive: number
      reviews_neutral: number
      reviews_negative: number
      avg_response_time_minutes: number | null
      profiles: { id: string; username: string; display_name: string | null; avatar_url: string | null; is_vip: boolean; status: string; seller_status: string } | null
    }[])
      .filter((s) => s.profiles?.status === 'active' && s.profiles?.seller_status === 'approved')
      .map((s, i) => ({
        user_id: s.user_id,
        username: s.profiles!.username,
        display_name: s.profiles!.display_name,
        avatar_url: s.profiles!.avatar_url,
        is_vip: s.profiles!.is_vip,
        total_sales: s.total_sales,
        reviews_positive: s.reviews_positive,
        reviews_neutral: s.reviews_neutral,
        reviews_negative: s.reviews_negative,
        total_reviews: s.reviews_positive + s.reviews_neutral + s.reviews_negative,
        reputation_score: calcScore(s.reviews_positive, s.reviews_neutral, s.reviews_negative),
        avg_response_time_minutes: s.avg_response_time_minutes,
      }))
      .filter((s) => s.reputation_score !== null)
      .sort((a, b) => (b.reputation_score ?? 0) - (a.reputation_score ?? 0) || b.total_sales - a.total_sales)
      .slice(0, 100)
  }

  const list = sellers.length > 0 ? sellers : fallbackSellers

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-4xl px-4 py-12 space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-foreground flex items-center justify-center gap-2"><Trophy className="h-8 w-8 text-amber-500" /> Ranking de Vendedores</h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Classificação baseada em avaliações recebidas de compradores. Mínimo de 3 avaliações para aparecer no ranking.
          </p>
        </div>

        {/* Fórmula */}
        <div className="rounded-2xl border border-border bg-card p-4 text-center text-xs text-muted-foreground">
          Score = (Positivas × 100 + Neutras × 50) ÷ Total de avaliações
          <span className="mx-2">·</span>
          <span className="text-foreground">Empate desempatado por número de vendas</span>
        </div>

        {/* Pódio top 3 */}
        {list.length >= 3 && (
          <div className="grid grid-cols-3 gap-3">
            {[list[1], list[0], list[2]].map((seller, podiumIdx) => {
              const actualRank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3
              const height = actualRank === 1 ? 'pt-0' : 'pt-6'
              const borderColor = actualRank === 1
                ? 'border-yellow-500/40 bg-yellow-500/5'
                : actualRank === 2
                ? 'border-border bg-card'
                : 'border-amber-700/40 bg-amber-900/10'
              return (
                <Link
                  key={seller.user_id}
                  href={`/perfil/${seller.username}`}
                  className={`${height} rounded-2xl border ${borderColor} p-4 flex flex-col items-center gap-2 hover:opacity-80 transition-opacity text-center`}
                >
                  <MedalIcon rank={actualRank} />
                  {seller.avatar_url ? (
                    <Image
                      src={seller.avatar_url}
                      alt={seller.username}
                      width={56}
                      height={56}
                      className="rounded-full object-cover ring-2 ring-border"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
                      {seller.username[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-foreground truncate max-w-[90px]">
                      {seller.display_name ?? seller.username}
                      {seller.is_vip && <Star className="inline h-3 w-3 text-amber-400 ml-1" />}
                    </p>
                    <p className="text-xs text-muted-foreground">@{seller.username}</p>
                  </div>
                  <p className="text-lg font-black text-foreground">{fmtScore(seller.reputation_score ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">{seller.total_reviews} aval.</p>
                </Link>
              )
            })}
          </div>
        )}

        {/* Lista completa */}
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Target className="h-12 w-12 text-muted-foreground" />
            <p className="text-foreground font-semibold">Nenhum vendedor no ranking ainda</p>
            <p className="text-muted-foreground text-sm">São necessárias pelo menos 3 avaliações para aparecer aqui.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Classificação completa</h2>
            {list.map((seller, idx) => {
              const rank = idx + 1
              const score = seller.reputation_score ?? 0
              const total = seller.total_reviews
              const posPct = total > 0 ? Math.round((seller.reviews_positive / total) * 100) : 0

              return (
                <Link
                  key={seller.user_id}
                  href={`/perfil/${seller.username}`}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card/60 px-4 py-3 hover:border-primary/50 transition-colors group"
                >
                  {/* Posição */}
                  <div className="w-8 text-center shrink-0">
                    <MedalIcon rank={rank} />
                  </div>

                  {/* Avatar */}
                  <div className="shrink-0">
                    {seller.avatar_url ? (
                      <Image
                        src={seller.avatar_url}
                        alt={seller.username}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                        {seller.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                        {seller.display_name ?? seller.username}
                        {seller.is_vip && <span className="ml-1 text-amber-400 text-xs inline-flex items-center"><Star className="h-3 w-3 mr-0.5" /> VIP</span>}
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0">@{seller.username}</span>
                    </div>
                    <ScoreBar score={score} />
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span className="text-emerald-500 font-medium">{posPct}% positivas</span>
                      <span>·</span>
                      <span>{total} avaliações</span>
                      <span>·</span>
                      <span>{seller.total_sales} vendas</span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <p className="text-xl font-black text-foreground">{fmtScore(score)}</p>
                    <p className="text-[10px] text-muted-foreground">/ 100</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* CTA */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-primary">Quer aparecer aqui?</p>
          <p className="text-xs text-muted-foreground">
            Complete vendas, entregue com qualidade e peça avaliações aos seus compradores.
          </p>
          <Link
            href="/meus-anuncios"
            className="inline-flex rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Gerenciar anúncios
          </Link>
        </div>
      </div>
    </div>
  )
}
