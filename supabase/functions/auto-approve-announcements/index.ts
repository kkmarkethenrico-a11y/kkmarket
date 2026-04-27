/**
 * Supabase Edge Function: auto-approve-announcements
 *
 * Roda a cada 1 hora via pg_cron.
 * Anúncios elegíveis para auto-aprovação:
 *   - status = 'pending'
 *   - criados há mais de 6h (deu tempo de moderação manual)
 *   - título + descrição não contêm termos proibidos
 *
 * Aprovação automática:
 *   - status → 'active', approved_at = now(), approved_by = null
 *   - Indexar no MeiliSearch
 *   - Notificação in-app
 *   - E-mail via Resend
 *
 * Deploy:
    supabase functions deploy auto-approve-announcements
 
 *Cron:
 *   SELECT cron.schedule(
 *     'auto-approve-announcements',
 *     '0 * * * *',
 *     $$SELECT net.http_post(
 *       url := 'https://<project>.supabase.co/functions/v1/auto-approve-announcements',
 *       headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
 *     )$$
 *   );
 */

// @ts-ignore — Deno edge runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// @ts-ignore
const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
// @ts-ignore
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
// @ts-ignore
const MEILISEARCH_HOST = Deno.env.get('MEILISEARCH_HOST') ?? 'http://localhost:7700'
// @ts-ignore
const MEILISEARCH_KEY  = Deno.env.get('MEILISEARCH_KEY') ?? ''
// @ts-ignore
const RESEND_API_KEY   = Deno.env.get('RESEND_API_KEY')  ?? ''
// @ts-ignore
const RESEND_FROM      = Deno.env.get('RESEND_FROM')     ?? 'noreply@kkmarket.com.br'
// @ts-ignore
const SITE_URL         = Deno.env.get('NEXT_PUBLIC_SITE_URL') ?? 'https://kkmarket.com.br'

// ─── Forbidden word patterns ──────────────────────────────────────────────────
// Must match keywords that shouldn't appear in titles/descriptions
const FORBIDDEN_PATTERNS: RegExp[] = [
  // Contact bypass
  /\b(whatsapp|telegram|discord|instagram|twitter|facebook|tiktok)\b/i,
  /\b(wa\.me|t\.me)\b/i,
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  /(\+?55\s?)?\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}/,

  // Prohibited content
  /\b(ph[i1]sh|fraude|golpe|scam|crack|keygen|exploit|ddos|botnet|ransomware|malware)\b/i,
  /\b(nude|nud[o0]|porno|xxx|onlyfans|nsfw)\b/i,

  // Impersonation / fake
  /\b(conta\s+hackeada|conta\s+roubada|hack(eada)?)\b/i,
]

async function hasForbiddenContent(text: string): Promise<string | null> {
  for (const p of FORBIDDEN_PATTERNS) {
    const m = text.match(p)
    if (m) return m[0]
  }
  return null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function indexDoc(doc: Record<string, unknown>) {
  if (!MEILISEARCH_KEY) return
  await fetch(`${MEILISEARCH_HOST}/indexes/announcements/documents`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${MEILISEARCH_KEY}`,
    },
    body: JSON.stringify([doc]),
  }).catch(console.error)
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return
  await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: RESEND_FROM, to, subject, html }),
  }).catch(console.error)
}

// @ts-ignore
Deno.serve(async (req) => {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.includes(SERVICE_ROLE_KEY)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 6h cutoff
  const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()

  const { data: pending, error } = await admin
    .from('announcements')
    .select(`
      id, title, description, slug, plan, unit_price, category_id, user_id, sale_count,
      profiles:user_id (display_name, username, email:id)
    `)
    .eq('status', 'pending')
    .lt('created_at', cutoff)
    .limit(200)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const results = { checked: 0, approved: 0, flagged: 0, errors: [] as string[] }

  for (const ann of pending ?? []) {
    results.checked++
    const combined = `${ann.title} ${ann.description}`
    const flag = await hasForbiddenContent(combined)

    if (flag) {
      results.flagged++
      // Mark with an internal note (admins still need to review flagged ones)
      await admin
        .from('announcements')
        .update({
          // Store flag in rejection_reason temporarily so admins see it
          rejection_reason: `[AUTO-FLAG] Padrão detectado: "${flag}". Aguardando revisão manual.`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ann.id)
      continue
    }

    const now = new Date().toISOString()
    const { error: updErr } = await admin
      .from('announcements')
      .update({
        status:           'active',
        approved_at:      now,
        approved_by:      null,
        rejection_reason: null,
        updated_at:       now,
      })
      .eq('id', ann.id)
      .eq('status', 'pending') // idempotência

    if (updErr) {
      results.errors.push(`${ann.id}: ${updErr.message}`)
      continue
    }

    // MeiliSearch
    await indexDoc({
      id:          ann.id,
      title:       ann.title,
      description: ann.description,
      slug:        ann.slug,
      plan:        ann.plan,
      unit_price:  ann.unit_price,
      category_id: ann.category_id,
      user_id:     ann.user_id,
      sale_count:  ann.sale_count,
      approved_at: now,
    })

    // Notification in-app
    await admin.from('notifications').insert({
      user_id: ann.user_id,
      type:    'announcement_approved',
      title:   'Anúncio aprovado! 🎉',
      message: `Seu anúncio "${ann.title}" foi aprovado automaticamente.`,
      data:    { announcement_id: ann.id, slug: ann.slug },
    }).catch(console.error)

    // Email — need seller email from auth
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(ann.user_id)
      const email = authUser?.user?.email
      const seller = ann.profiles as unknown as { username?: string; display_name?: string }
      const name   = seller?.display_name ?? seller?.username ?? 'Vendedor'
      if (email) {
        await sendEmail(
          email,
          `✅ Seu anúncio foi aprovado — ${ann.title}`,
          `<h2>Parabéns, ${name}!</h2>
           <p>Seu anúncio <strong>${ann.title}</strong> foi aprovado automaticamente e já está visível na plataforma.</p>
           <p><a href="${SITE_URL}/anuncio/${ann.slug}">Ver anúncio →</a></p>`,
        )
      }
    } catch (e) {
      console.error('[auto-approve] email failed', e)
    }

    results.approved++
  }

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  })
})
