import MercadoPago from 'mercadopago'

if (!process.env.MP_ACCESS_TOKEN) {
  throw new Error('MP_ACCESS_TOKEN não definido')
}

export const mp = new MercadoPago({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!

// Taxas por plano (lidas do .env, com fallback)
export const PLATFORM_FEES = {
  silver:  parseFloat(process.env.MP_MARKETPLACE_FEE_SILVER  ?? '0.0999'),
  gold:    parseFloat(process.env.MP_MARKETPLACE_FEE_GOLD    ?? '0.1199'),
  diamond: parseFloat(process.env.MP_MARKETPLACE_FEE_DIAMOND ?? '0.1299'),
}
