/**
 * lib/pagarme/webhooks.ts
 *
 * Webhook signature verification for Pagar.me.
 * Uses HMAC-SHA256 with PAGARME_WEBHOOK_SECRET.
 */

import { createHmac } from 'crypto'

/**
 * Verify the HMAC signature of a Pagar.me webhook request.
 * Returns true if valid, false otherwise.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  const secret = process.env.PAGARME_WEBHOOK_SECRET
  if (!secret) {
    console.error('[webhook] PAGARME_WEBHOOK_SECRET not configured')
    return false
  }

  if (!signature) {
    console.error('[webhook] No signature header present')
    return false
  }

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')

  // Timing-safe comparison
  if (expected.length !== signature.length) return false

  let result = 0
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }

  return result === 0
}