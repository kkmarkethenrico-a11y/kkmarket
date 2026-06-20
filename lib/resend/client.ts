import { Resend } from 'resend'

let _client: Resend | null = null

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  if (!_client) _client = new Resend(apiKey)
  return _client
}

export const RESEND_FROM = process.env.RESEND_FROM ?? 'KKmarket <noreply@kkmarket.com.br>'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kkmarket.com.br'
