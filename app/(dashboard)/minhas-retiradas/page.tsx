import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkKycComplete } from '@/lib/validations/kyc'
import { WITHDRAWAL_LIMITS } from '@/lib/pagarme/withdrawals'
import WithdrawalsClient from './WithdrawalsClient'

export const dynamic = 'force-dynamic'

export default async function MinhasRetiradasPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const [{ data: stats }, { data: items }, kyc] = await Promise.all([
    admin.from('user_stats').select('wallet_balance').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('withdrawal_requests')
      .select('id, amount, fee, net_amount, type, pix_key, pix_key_type, status, rejection_note, processed_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    checkKycComplete(user.id),
  ])

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 space-y-6">
      <h1 className="text-2xl font-bold">Minhas Retiradas</h1>

      <WithdrawalsClient
        balance={Number(stats?.wallet_balance ?? 0)}
        kyc={kyc}
        history={items ?? []}
        limits={{
          MIN_AMOUNT: WITHDRAWAL_LIMITS.MIN_AMOUNT,
          TURBO_FEE:  WITHDRAWAL_LIMITS.TURBO_FEE,
        }}
      />
    </div>
  )
}
