'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { POINTS_TO_BRL_RATE, creditarPontos } from '@/lib/points'

export async function exchangePointsAction(pointsToExchange: number) {
  if (!pointsToExchange || pointsToExchange <= 0) {
    return { success: false, message: 'Quantidade inválida.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, message: 'Não autorizado.' }
  }

  const admin = createAdminClient()
  
  const { data: result, error } = await admin.rpc('exchange_points_to_wallet', {
    p_user_id: user.id,
    p_points: pointsToExchange,
    p_exchange_rate: POINTS_TO_BRL_RATE
  })

  if (error || !result) {
    console.error('Error exchanging points:', error)
    return { success: false, message: 'Pontos insuficientes ou erro ao converter.' }
  }

  revalidatePath('/painel')
  revalidatePath('/kks-points')

  return { success: true, message: 'Conversão realizada com sucesso!' }
}

export async function claimQuestAction(questId: string, pts: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, message: 'Não autorizado.' }
  }

  const admin = createAdminClient()
  
  // To avoid claiming the same quest multiple times, we can use reference_id or description
  // Since we don't have a unique quest table, we'll check if a transaction for this quest already exists
  const questReference = `quest_${questId}`

  const { data: existing } = await admin
    .from('points_transactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('description', questReference)
    .maybeSingle()

  if (existing) {
    return { success: false, message: 'Quest já resgatada.' }
  }

  // Double check actual requirements
  const { data: stats } = await admin
    .from('user_stats')
    .select('total_purchases, total_sales')
    .eq('user_id', user.id)
    .maybeSingle()

  let valid = false

  if (questId === 'first_purchase') {
    valid = (stats?.total_purchases ?? 0) >= 1
  } else if (questId === 'first_sale') {
    valid = (stats?.total_sales ?? 0) >= 1
  } else if (questId === 'invite_friend') {
    // Emulated invite validation
    valid = false 
  }

  if (!valid) {
    return { success: false, message: 'Requisitos não atingidos.' }
  }

  // Credit the points
  try {
    await creditarPontos({
      userId: user.id,
      amount: pts,
      type: 'event', // Using 'event' or 'loyalty'
      description: questReference,
    })
    
    revalidatePath('/painel')
    return { success: true, message: 'XP resgatado!' }
  } catch (e: any) {
    return { success: false, message: e.message ?? 'Erro ao resgatar XP.' }
  }
}
