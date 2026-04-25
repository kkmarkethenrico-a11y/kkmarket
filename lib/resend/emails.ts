/**
 * lib/resend/emails.ts
 *
 * E-mail templates para moderação de anúncios.
 * Usa Resend SDK (RESEND_API_KEY env var).
 *
 * No ambiente de dev, faz fallback para log se a chave não estiver presente.
 */

interface AnnouncementApprovedParams {
  to:    string
  name:  string
  title: string
  slug:  string
}

interface AnnouncementRejectedParams {
  to:     string
  name:   string
  title:  string
  reason: string
}

async function send(payload: {
  from: string
  to:   string
  subject: string
  html: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log('[resend] RESEND_API_KEY not set — skipping email:', payload.subject, '→', payload.to)
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('[resend] send failed:', err)
  }
}

const FROM = process.env.RESEND_FROM ?? 'noreply@kkmarket.com.br'
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kkmarket.com.br'

export async function sendAnnouncementApproved(params: AnnouncementApprovedParams) {
  await send({
    from:    FROM,
    to:      params.to,
    subject: `✅ Seu anúncio foi aprovado — ${params.title}`,
    html: `
      <h2>Parabéns, ${params.name}!</h2>
      <p>Seu anúncio <strong>${params.title}</strong> foi aprovado e já está visível na plataforma.</p>
      <p><a href="${SITE}/anuncio/${params.slug}">Ver anúncio →</a></p>
      <hr/>
      <p style="color:#888;font-size:12px">KKMarket — Marketplace de Produtos Digitais</p>
    `,
  })
}

export async function sendAnnouncementRejected(params: AnnouncementRejectedParams) {
  await send({
    from:    FROM,
    to:      params.to,
    subject: `❌ Seu anúncio precisou ser revisado — ${params.title}`,
    html: `
      <h2>Olá, ${params.name}.</h2>
      <p>Infelizmente seu anúncio <strong>${params.title}</strong> não pôde ser aprovado pelo seguinte motivo:</p>
      <blockquote style="border-left:4px solid #e53e3e;padding-left:12px;color:#555">${params.reason}</blockquote>
      <p>Você pode corrigir o anúncio e resubmetê-lo a qualquer momento no seu painel.</p>
      <p><a href="${SITE}/meus-anuncios">Ir para Meus Anúncios →</a></p>
      <hr/>
      <p style="color:#888;font-size:12px">KKMarket — Marketplace de Produtos Digitais</p>
    `,
  })
}
