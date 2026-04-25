/**
 * lib/auto-delivery/crypto.ts
 *
 * Criptografia AES-256-CBC para credenciais de entrega automática.
 *
 * ⚠️ SEGURANÇA CRÍTICA:
 *   - O payload em TEXTO PURO nunca pode ser persistido em nenhum lugar.
 *   - Apenas a função `encryptPayload` aceita texto puro; a saída é o que
 *     vai para o banco em `auto_delivery_items.payload`.
 *   - `decryptPayload` só deve ser chamada server-side (Route Handler ou
 *     Edge Function) no momento exato da entrega.
 *   - ENCRYPTION_KEY deve ter 32 bytes (64 chars hex). Se inválida,
 *     o módulo lança imediatamente — falhar seguro.
 *
 * Formato armazenado:
 *   "<iv_hex>:<ciphertext_hex>"
 *   - iv_hex: 16 bytes (32 hex chars), aleatório por payload
 *   - ciphertext_hex: AES-256-CBC com PKCS#7 padding
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGO       = 'aes-256-cbc'
const KEY_BYTES  = 32
const IV_BYTES   = 16

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) {
    throw new Error(
      '[auto-delivery/crypto] ENCRYPTION_KEY ausente. Defina 32 bytes em hex (64 chars) em .env.',
    )
  }
  // Aceita hex (64 chars) ou base64 (44 chars). Padrão: hex.
  let key: Buffer
  if (/^[a-fA-F0-9]{64}$/.test(raw)) {
    key = Buffer.from(raw, 'hex')
  } else {
    // fallback: base64
    key = Buffer.from(raw, 'base64')
  }
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `[auto-delivery/crypto] ENCRYPTION_KEY inválida: esperado ${KEY_BYTES} bytes, recebido ${key.length}.`,
    )
  }
  return key
}

/**
 * Cifra um payload de texto puro. Devolve string segura para gravar no banco.
 * Cada chamada gera um IV novo, então o mesmo input produz outputs diferentes.
 */
export function encryptPayload(plainText: string): string {
  if (typeof plainText !== 'string' || plainText.length === 0) {
    throw new Error('[auto-delivery/crypto] payload vazio.')
  }
  const key    = getKey()
  const iv     = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGO, key, iv)
  const enc    = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  return `${iv.toString('hex')}:${enc.toString('hex')}`
}

/**
 * Decifra um payload no formato "<iv_hex>:<ciphertext_hex>".
 * Lança se o formato ou a chave estiverem incorretos.
 */
export function decryptPayload(encrypted: string): string {
  if (typeof encrypted !== 'string' || !encrypted.includes(':')) {
    throw new Error('[auto-delivery/crypto] formato inválido.')
  }
  const [ivHex, cipherHex] = encrypted.split(':')
  if (!ivHex || !cipherHex) {
    throw new Error('[auto-delivery/crypto] payload mal-formado.')
  }
  const key      = getKey()
  const iv       = Buffer.from(ivHex, 'hex')
  if (iv.length !== IV_BYTES) {
    throw new Error('[auto-delivery/crypto] IV inválido.')
  }
  const decipher = createDecipheriv(ALGO, key, iv)
  const dec      = Buffer.concat([
    decipher.update(Buffer.from(cipherHex, 'hex')),
    decipher.final(),
  ])
  return dec.toString('utf8')
}

/**
 * Helper de debug: mascara um payload em texto puro para logs/UI
 * (`abcd1234` → `••••1234`). Nunca chame com texto criptografado.
 */
export function maskPayload(plainText: string): string {
  if (plainText.length <= 4) return '•'.repeat(plainText.length)
  return '•'.repeat(Math.max(4, plainText.length - 4)) + plainText.slice(-4)
}
