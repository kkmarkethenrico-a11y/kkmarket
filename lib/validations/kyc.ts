/**
 * lib/validations/kyc.ts
 *
 * Verifica se o usuário concluiu todas as etapas obrigatórias do KYC
 * para liberar saques. Tipos exigidos (contexto.md §7):
 *   email, phone, identity_front, identity_back, selfie
 *
 * `residence` NÃO é obrigatório para saque.
 */

import { createAdminClient } from '@/lib/supabase/admin'

export const REQUIRED_KYC_TYPES = [
  'email',
  'phone',
  'identity_front',
  'identity_back',
  'selfie',
] as const

export type RequiredKycType = (typeof REQUIRED_KYC_TYPES)[number]

export interface KycCheckResult {
  complete: boolean
  missing:  RequiredKycType[]
  pending:  RequiredKycType[]
  rejected: RequiredKycType[]
}

export async function checkKycComplete(userId: string): Promise<KycCheckResult> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('user_validations')
    .select('type, status')
    .eq('user_id', userId)
    .in('type', REQUIRED_KYC_TYPES as unknown as string[])

  if (error) {
    console.error('[kyc] check failed:', error)
    return {
      complete: false,
      missing:  [...REQUIRED_KYC_TYPES],
      pending:  [],
      rejected: [],
    }
  }

  const byType = new Map<string, string>()
  for (const row of data ?? []) byType.set(row.type, row.status)

  const missing:  RequiredKycType[] = []
  const pending:  RequiredKycType[] = []
  const rejected: RequiredKycType[] = []

  for (const t of REQUIRED_KYC_TYPES) {
    const s = byType.get(t)
    if (!s)               missing.push(t)
    else if (s === 'pending')  pending.push(t)
    else if (s === 'rejected') rejected.push(t)
  }

  return {
    complete: missing.length === 0 && pending.length === 0 && rejected.length === 0,
    missing,
    pending,
    rejected,
  }
}
