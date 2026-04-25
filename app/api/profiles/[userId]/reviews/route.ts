/**
 * GET /api/profiles/[userId]/reviews
 *
 * Lista avaliações recebidas por um usuário (seller ou buyer).
 * Paginação via ?from=&to= (range Supabase) e ?role= (buyer|seller|all).
 * Público — não requer auth.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PAGE_SIZE = 10

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params
  const url  = new URL(request.url)

  const from = parseInt(url.searchParams.get('from') ?? '0', 10)
  const to   = Math.min(from + PAGE_SIZE - 1, from + 49) // cap de segurança
  const role = url.searchParams.get('role') ?? 'all'     // buyer | seller | all

  const supabase = await createClient()

  let query = supabase
    .from('order_reviews')
    .select(
      'id, reviewer_id, type, message, created_at, role, profiles!reviewer_id(username, display_name, avatar_url)',
      { count: 'exact' },
    )
    .eq('reviewed_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (role === 'buyer' || role === 'seller') {
    query = query.eq('role', role)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('[profiles.reviews.GET]', error)
    return NextResponse.json({ error: 'Falha ao buscar avaliações.' }, { status: 500 })
  }

  return NextResponse.json({
    reviews: data ?? [],
    hasMore: (count ?? 0) > to + 1,
    total:   count ?? 0,
  })
}
