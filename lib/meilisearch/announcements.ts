/**
 * lib/meilisearch/announcements.ts
 *
 * Indexa / remove anúncios do MeiliSearch.
 * Usa a HTTP API diretamente (sem SDK extra) para manter zero deps.
 *
 * Env vars obrigatórias:
 *   MEILISEARCH_HOST  (ex: https://search.kkmarket.com.br)
 *   MEILISEARCH_KEY   (Admin API key — server-side only)
 */

const HOST  = process.env.MEILISEARCH_HOST ?? 'http://localhost:7700'
const KEY   = process.env.MEILISEARCH_KEY  ?? ''
const INDEX = 'announcements'

function headers(): HeadersInit {
  return {
    'Content-Type':  'application/json',
    Authorization:   `Bearer ${KEY}`,
  }
}

export interface AnnouncementDoc {
  id:            string
  title:         string
  description:   string
  slug:          string
  plan:          string
  unit_price:    number | null
  category_id:   string
  user_id:       string
  sale_count:    number
  approved_at:   string | null
}

export async function indexAnnouncement(doc: AnnouncementDoc) {
  if (!KEY) {
    console.log('[meilisearch] MEILISEARCH_KEY not set — skipping index:', doc.id)
    return
  }
  const res = await fetch(`${HOST}/indexes/${INDEX}/documents`, {
    method:  'POST',
    headers: headers(),
    body:    JSON.stringify([doc]),
  })
  if (!res.ok) {
    console.error('[meilisearch] indexAnnouncement failed:', await res.text())
  }
}

export async function removeAnnouncementFromIndex(id: string) {
  if (!KEY) return
  const res = await fetch(`${HOST}/indexes/${INDEX}/documents/${id}`, {
    method:  'DELETE',
    headers: headers(),
  })
  if (!res.ok) {
    console.error('[meilisearch] removeAnnouncement failed:', await res.text())
  }
}
