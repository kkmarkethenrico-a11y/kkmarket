/**
 * Chat Anti-Bypass Filter
 *
 * Detecta e censura tentativas de levar a negociação para fora da
 * plataforma (telefones, redes sociais, links encurtados etc.).
 *
 * Usado SERVER-SIDE no Route Handler de mensagens (POST /api/orders/[id]/messages)
 * antes de gravar em `public.order_messages`. Também pode ser chamado
 * client-side apenas como preview (a verdade vive no servidor).
 */

export const REPLACEMENT_TOKEN = '[BLOQUEADO]'

export const REPLACEMENT_MESSAGE =
  '⚠️ [Contato externo bloqueado] Negocie pela plataforma para sua proteção.'

// ─── Padrões de bloqueio ──────────────────────────────────────────────
export const BLOCK_PATTERNS: RegExp[] = [
  // Telefones brasileiros (com ou sem DDD/+55, com ou sem hífen)
  /(\+?55\s?)?\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}/g,

  // WhatsApp (links e domínios)
  /(wa\.me|api\.whatsapp\.com|whatsapp\.com\/send|chat\.whatsapp\.com)/gi,

  // Telegram (@user, t.me, telegram.me)
  /(@[a-z0-9_]{5,})|(t\.me\/[a-z0-9_]+)|(telegram\.me\/[a-z0-9_]+)|(telegram:\s*@?[a-z0-9_]+)/gi,

  // Discord (convites e tag #1234)
  /(discord\.gg\/[a-z0-9]+)|(discord\.com\/invite\/[a-z0-9]+)|([a-z0-9_]{2,32}#\d{4})/gi,

  // Instagram
  /(instagram\.com\/[a-z0-9_.]+)|(insta:\s*@?[a-z0-9_.]+)|(\big:\s*@?[a-z0-9_.]+)/gi,

  // Emails
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,

  // Sequências de 8+ dígitos (telefone sem formatação, número de cartão etc.)
  /\b\d{8,}\b/g,

  // Padrões ofuscados: t.e.l.e.g.r.a.m, wh4ts4pp, d1sc0rd, 1n5t4
  /\b(t[\s._-]*e[\s._-]*l[\s._-]*e[\s._-]*g[\s._-]*r[\s._-]*a[\s._-]*m)\b/gi,
  /\bwh[a4@][\s._-]*t[\s._-]*s[\s._-]*[a4@][\s._-]*p[\s._-]*p\b/gi,
  /\bd[i1!|][\s._-]*s[\s._-]*c[o0][\s._-]*r[\s._-]*d\b/gi,
  /\bin[s$5][\s._-]*t[a4@]g?r?[a4@]?m?\b/gi,

  // Encurtadores de link suspeitos
  /\b(bit\.ly|tinyurl\.com|t\.co|goo\.gl|cutt\.ly|is\.gd|ow\.ly|rebrand\.ly|shorturl\.at)\/[a-z0-9]+/gi,
]

export interface FilterResult {
  /** true se algum padrão foi detectado e o conteúdo foi sanitizado */
  filtered: boolean
  /** conteúdo após substituição (seguro para gravar/exibir) */
  content: string
  /** conteúdo original recebido (para log admin, NUNCA exibir publicamente) */
  originalContent: string
  /** quantidade total de matches encontrados */
  matchCount: number
}

/**
 * Aplica todos os padrões de bloqueio e devolve o resultado sanitizado.
 */
export function filterMessage(content: string): FilterResult {
  const original = content
  let result = content
  let matchCount = 0
  let filtered = false

  for (const pattern of BLOCK_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags)
    const matches = result.match(re)
    if (matches && matches.length > 0) {
      filtered = true
      matchCount += matches.length
      result = result.replace(re, REPLACEMENT_TOKEN)
    }
  }

  return {
    filtered,
    content: result,
    originalContent: original,
    matchCount,
  }
}

/**
 * Versão "preview" para uso client-side no input do chat.
 * Apenas indica se há padrão suspeito, sem expor a substituição.
 */
export function previewHasBlockedContent(content: string): boolean {
  for (const pattern of BLOCK_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags)
    if (re.test(content)) return true
  }
  return false
}
