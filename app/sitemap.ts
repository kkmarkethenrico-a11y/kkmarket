import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE_URL   = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kkmarket.com.br'
const CHUNK_SIZE = 10_000

// ─── Static URLs ─────────────────────────────────────────────────────────────
const STATIC_URLS: MetadataRoute.Sitemap = [
  { url: `${BASE_URL}/`,                    changeFrequency: 'daily',   priority: 1.0, lastModified: new Date() },
  { url: `${BASE_URL}/categorias`,          changeFrequency: 'weekly',  priority: 0.9 },
  { url: `${BASE_URL}/como-funciona`,       changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/blog`,                changeFrequency: 'daily',   priority: 0.8 },
  { url: `${BASE_URL}/tarifas-e-prazos`,    changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE_URL}/formas-de-pagamento`, changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE_URL}/programa-de-pontos`,  changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/perguntas-frequentes`, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE_URL}/verificador`,         changeFrequency: 'weekly',  priority: 0.8 },
]

// ─── Dynamic URL builder ──────────────────────────────────────────────────────
async function buildAllUrls(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient()

  const [
    { data: cats },
    { data: anns },
    { data: posts },
    { data: profiles },
  ] = await Promise.all([
    // subcategories (have parent_id) with their parent slug for URL
    supabase
      .from('categories')
      .select('slug, updated_at, parent:parent_id(slug)')
      .eq('status', true)
      .not('parent_id', 'is', null)
      .limit(50_000),

    // active announcements
    supabase
      .from('announcements')
      .select('slug, updated_at')
      .eq('status', 'active')
      .limit(50_000),

    // published blog posts
    supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('is_published', true)
      .limit(50_000),

    // active profiles
    supabase
      .from('profiles')
      .select('username, updated_at')
      .eq('status', 'active')
      .limit(50_000),
  ])

  const catEntries: MetadataRoute.Sitemap = (cats ?? []).flatMap((c) => {
    const parent = c.parent as unknown as { slug: string } | null
    if (!parent?.slug) return []
    return [{
      url:             `${BASE_URL}/categoria/${parent.slug}/${c.slug}`,
      lastModified:    c.updated_at,
      changeFrequency: 'daily',
      priority:        0.8,
    }]
  })

  const annEntries: MetadataRoute.Sitemap = (anns ?? []).map((a) => ({
    url:             `${BASE_URL}/anuncio/${a.slug}`,
    lastModified:    a.updated_at,
    changeFrequency: 'daily',
    priority:        0.9,
  }))

  const postEntries: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
    url:             `${BASE_URL}/blog/${p.slug}`,
    lastModified:    p.updated_at,
    changeFrequency: 'weekly',
    priority:        0.7,
  }))

  const profileEntries: MetadataRoute.Sitemap = (profiles ?? []).map((p) => ({
    url:             `${BASE_URL}/perfil/${p.username}`,
    lastModified:    p.updated_at,
    changeFrequency: 'weekly',
    priority:        0.6,
  }))

  return [
    ...STATIC_URLS,
    ...catEntries,
    ...annEntries,
    ...postEntries,
    ...profileEntries,
  ]
}

// ─── generateSitemaps ─────────────────────────────────────────────────────────
// Called at build time to determine how many sitemap files to produce.
// Each file is served at /sitemap/[id].xml; /sitemap.xml becomes the index.
export async function generateSitemaps() {
  const supabase = createAdminClient()

  const [
    { count: catCount },
    { count: annCount },
    { count: postCount },
    { count: profCount },
  ] = await Promise.all([
    supabase.from('categories').select('*', { count: 'exact', head: true }).eq('status', true).not('parent_id', 'is', null),
    supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  const total  = STATIC_URLS.length + (catCount ?? 0) + (annCount ?? 0) + (postCount ?? 0) + (profCount ?? 0)
  const chunks = Math.max(1, Math.ceil(total / CHUNK_SIZE))

  return Array.from({ length: chunks }, (_, id) => ({ id }))
}

// ─── Default export (per-chunk sitemap) ──────────────────────────────────────
export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const all = await buildAllUrls()
  return all.slice(id * CHUNK_SIZE, (id + 1) * CHUNK_SIZE)
}
