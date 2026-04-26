import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  identityFrontUrl: z.string().url(),
  identityBackUrl:  z.string().url(),
  selfieUrl:        z.string().url(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { error } = await supabase.rpc('apply_to_sell', {
    p_identity_front_url: parsed.data.identityFrontUrl,
    p_identity_back_url:  parsed.data.identityBackUrl,
    p_selfie_url:         parsed.data.selfieUrl,
  })

  if (error) {
    console.error('[seller-application] rpc error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, status: 'pending' })
}
