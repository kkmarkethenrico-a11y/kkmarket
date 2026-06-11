'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function markAsReadAction(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const admin = createAdminClient()
  
  const { error } = await admin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false }
  }

  revalidatePath('/notificacoes')
  return { success: true }
}

export async function markAllAsReadAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const admin = createAdminClient()
  
  const { error } = await admin
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    return { success: false }
  }

  revalidatePath('/notificacoes')
  return { success: true }
}
