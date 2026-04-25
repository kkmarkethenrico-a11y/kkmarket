/**
 * /api/admin/announcements/pending-count
 *
 * GET — retorna o total de anúncios com status='pending'.
 * Usado pelo badge no sidebar admin, revalidado a cada 60s via Next.js cache.
 *
 * Auth: role admin | moderator.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const revalidate = 60

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ count: 0 }, { status: 401 })

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!me || (me.role !== 'admin' && me.role !== 'moderator')) {
    return NextResponse.json({ count: 0 }, { status: 403 })
  }

  const admin = createAdminClient()
  const { count } = await admin
    .from('announcements')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  return NextResponse.json({ count: count ?? 0 })
}
