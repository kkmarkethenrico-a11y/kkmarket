import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ─── Zod schema for the POST body ────────────────────────────────────────────
const variationSchema = z.object({
  title:          z.string().min(1),
  unit_price:     z.number().min(2),
  stock_quantity: z.number().int().min(1),
  sort_order:     z.number().int().min(0),
})

const bodySchema = z.discriminatedUnion('model', [
  z.object({
    model:            z.literal('normal'),
    category_id:      z.string().uuid(),
    title:            z.string().min(5).max(120),
    description:      z.string().min(50),
    plan:             z.enum(['silver', 'gold', 'diamond']),
    unit_price:       z.number().min(2),
    stock_quantity:   z.number().int().min(1),
    has_auto_delivery: z.boolean(),
    filters_data:     z.record(z.string(), z.string()).optional(),
    cover_url:        z.string().url().optional(),
    gallery_urls:     z.array(z.string()).optional(),
  }),
  z.object({
    model:            z.literal('dynamic'),
    category_id:      z.string().uuid(),
    title:            z.string().min(5).max(120),
    description:      z.string().min(50),
    plan:             z.enum(['silver', 'gold', 'diamond']),
    variations:       z.array(variationSchema).min(2).max(20),
    has_auto_delivery: z.boolean(),
    filters_data:     z.record(z.string(), z.string()).optional(),
    cover_url:        z.string().url().optional(),
    gallery_urls:     z.array(z.string()).optional(),
  }),
])

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  // Parse + validate body
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos.', details: z.flattenError(parsed.error) },
      { status: 422 },
    )
  }

  const data = parsed.data

  // Generate slug
  const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`

  // Build announcement row
  const announcementRow: Record<string, unknown> = {
    user_id:          user.id,
    category_id:      data.category_id,
    title:            data.title,
    slug,
    description:      data.description,
    model:            data.model,
    plan:             data.plan,
    has_auto_delivery: data.has_auto_delivery,
    filters_data:     data.filters_data ?? null,
    status:           'pending',
  }

  if (data.model === 'normal') {
    announcementRow.unit_price     = data.unit_price
    announcementRow.stock_quantity = data.stock_quantity
  }

  // Insert announcement
  const { data: announcement, error: annError } = await supabase
    .from('announcements')
    .insert(announcementRow)
    .select('id')
    .single()

  if (annError || !announcement) {
    console.error('[api/announcements] insert error:', annError?.message)
    return NextResponse.json({ error: 'Erro ao criar anúncio.' }, { status: 500 })
  }

  const announcementId = announcement.id

  // Insert variations (dynamic)
  if (data.model === 'dynamic') {
    const itemsRows = data.variations.map((v) => ({
      announcement_id: announcementId,
      title:           v.title,
      unit_price:      v.unit_price,
      stock_quantity:  v.stock_quantity,
      sort_order:      v.sort_order,
    }))
    const { error: itemsError } = await supabase.from('announcement_items').insert(itemsRows)
    if (itemsError) {
      console.error('[api/announcements] items error:', itemsError.message)
      // Roll back by deleting the announcement
      await supabase.from('announcements').delete().eq('id', announcementId)
      return NextResponse.json({ error: 'Erro ao criar variações.' }, { status: 500 })
    }
  }

  // Insert images
  const imageRows: { announcement_id: string; url: string; is_cover: boolean; sort_order: number }[] = []
  if (data.cover_url) {
    imageRows.push({ announcement_id: announcementId, url: data.cover_url, is_cover: true, sort_order: 0 })
  }
  if (data.gallery_urls && data.gallery_urls.length > 0) {
    data.gallery_urls.forEach((url, i) => {
      imageRows.push({ announcement_id: announcementId, url, is_cover: false, sort_order: i + 1 })
    })
  }
  if (imageRows.length > 0) {
    const { error: imgError } = await supabase.from('announcement_images').insert(imageRows)
    if (imgError) {
      console.error('[api/announcements] images error:', imgError.message)
      // Non-fatal: announcement was created, images can be re-uploaded
    }
  }

  return NextResponse.json({ id: announcementId, slug }, { status: 201 })
}
