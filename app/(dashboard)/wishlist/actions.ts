'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function removeFromWishlistAction(wishlistId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Não autorizado.' }

  const { error } = await supabase
    .from('wishlist')
    .delete()
    .eq('id', wishlistId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, message: 'Erro ao remover dos favoritos.' }
  }

  revalidatePath('/wishlist')
  revalidatePath('/painel')
  
  return { success: true }
}
