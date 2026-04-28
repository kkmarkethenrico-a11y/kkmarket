export type MPPaymentMethod = 'pix' | 'ticket' | 'credit_card'
export type MPPaymentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'charged_back'
  | 'in_process'

export interface MPCreatePaymentParams {
  orderId:         string
  amount:          number
  method:          MPPaymentMethod
  buyerEmail:      string
  description:     string
  cardToken?:      string  // apenas para credit_card
  installments?:   number  // apenas para credit_card, default 1
  buyerFirstName?: string  // requerido para boleto (ticket)
  buyerLastName?:  string  // requerido para boleto (ticket)
  buyerCpf?:       string  // requerido para boleto (ticket) — somente dígitos
}

export interface MPPaymentResult {
  id:                string
  status:            MPPaymentStatus
  pixQrCode?:        string
  pixQrCodeBase64?:  string
  pixExpiration?:    string
  boletoUrl?:        string
  boletoExpiration?: string
  boletoBarcode?:    string
}
