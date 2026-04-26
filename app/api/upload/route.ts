import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_BUCKETS = new Set(['kyc-docs', 'announcement-images', 'avatars'])
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const form = await request.formData()
  const file = form.get('file')
  const bucket = (form.get('bucket')?.toString() ?? '').trim()

  if (!ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: 'Bucket inválido' }, { status: 400 })
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Arquivo ausente' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Arquivo excede 10MB' }, { status: 400 })
  }

  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (error) {
    console.error('[upload] error:', error.message)
    return NextResponse.json({ error: 'Falha no upload' }, { status: 500 })
  }

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path)
  return NextResponse.json({ path, url: pub.publicUrl })
}
