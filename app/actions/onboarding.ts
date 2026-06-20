'use server'

import { createClient } from '@/lib/supabase/server'

export async function completePlatformTourAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: true }

  const { error } = await supabase
    .from('profiles')
    .update({ platform_tour_completed_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) {
    console.error('completePlatformTourAction:', error)
    return { success: false }
  }

  return { success: true }
}
