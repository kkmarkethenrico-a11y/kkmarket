'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function redeemMissionsRewardAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: 'Usuário não autenticado.' }
  }

  // 1. Fetch current points from user_stats to ensure server-side consistency
  const { data: stats } = await supabase
    .from('user_stats')
    .select('points_balance')
    .eq('user_id', user.id)
    .single()

  const currentPoints = stats?.points_balance ?? 0

  if (currentPoints < 1500) {
    return { success: false, message: 'Você não possui o saldo mínimo de 1.500 KK-COINS.' }
  }

  // 2. Call debit_points RPC to atomically deduct 1500 points and log transaction
  const { data: success, error } = await supabase.rpc('debit_points', {
    p_user_id: user.id,
    p_amount: 1500,
    p_type: 'event',
    p_description: 'Resgate de recompensa (Missões & Recompensas)'
  })

  if (error || !success) {
    return { success: false, message: error?.message || 'Erro ao processar resgate de pontos.' }
  }

  // 3. Revalidate paths to update point indicators across components
  revalidatePath('/')

  return { success: true, message: 'Recompensa resgatada com sucesso!' }
}
