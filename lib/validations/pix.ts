/**
 * lib/validations/pix.ts
 *
 * Validação de chaves PIX. Tipos suportados:
 *  - cpf      (11 dígitos, com checksum)
 *  - cnpj     (14 dígitos, com checksum)
 *  - email    (RFC simplificado)
 *  - phone    (E.164: +55XXXXXXXXXXX)
 *  - random   (UUID v4)
 */

export const PIX_KEY_TYPES = ['cpf', 'cnpj', 'email', 'phone', 'random'] as const
export type PixKeyType = (typeof PIX_KEY_TYPES)[number]

export function normalizePixKey(type: PixKeyType, raw: string): string {
  const v = raw.trim()
  if (type === 'cpf' || type === 'cnpj') return v.replace(/\D/g, '')
  if (type === 'phone') {
    const digits = v.replace(/\D/g, '')
    return digits.startsWith('55') ? `+${digits}` : `+55${digits}`
  }
  if (type === 'email') return v.toLowerCase()
  return v.toLowerCase()
}

function isValidCpf(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1+$/.test(cpf)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i)
  let d1 = 11 - (sum % 11)
  if (d1 >= 10) d1 = 0
  if (d1 !== parseInt(cpf[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i)
  let d2 = 11 - (sum % 11)
  if (d2 >= 10) d2 = 0
  return d2 === parseInt(cpf[10])
}

function isValidCnpj(cnpj: string): boolean {
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1+$/.test(cnpj)) return false
  const calc = (base: string, weights: number[]) => {
    const sum = weights.reduce((a, w, i) => a + parseInt(base[i]) * w, 0)
    const r = sum % 11
    return r < 2 ? 0 : 11 - r
  }
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const w2 = [6, ...w1]
  const d1 = calc(cnpj.slice(0, 12), w1)
  const d2 = calc(cnpj.slice(0, 13), w2)
  return d1 === parseInt(cnpj[12]) && d2 === parseInt(cnpj[13])
}

export function validatePixKey(type: PixKeyType, raw: string): {
  valid: boolean
  normalized: string
  reason?: string
} {
  const normalized = normalizePixKey(type, raw)

  switch (type) {
    case 'cpf':
      return isValidCpf(normalized)
        ? { valid: true, normalized }
        : { valid: false, normalized, reason: 'CPF inválido.' }

    case 'cnpj':
      return isValidCnpj(normalized)
        ? { valid: true, normalized }
        : { valid: false, normalized, reason: 'CNPJ inválido.' }

    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized)
        ? { valid: true, normalized }
        : { valid: false, normalized, reason: 'E-mail inválido.' }

    case 'phone':
      // E.164 BR: +55 + DDD(2) + número(8 ou 9) = 13 ou 14 chars
      return /^\+55\d{10,11}$/.test(normalized)
        ? { valid: true, normalized }
        : { valid: false, normalized, reason: 'Telefone inválido (use +55DDDNUMERO).' }

    case 'random':
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(normalized)
        ? { valid: true, normalized }
        : { valid: false, normalized, reason: 'Chave aleatória deve ser um UUID.' }
  }
}
