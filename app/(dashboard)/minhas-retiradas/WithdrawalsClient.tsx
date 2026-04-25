'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface Withdrawal {
  id:             string
  amount:         number
  fee:            number
  net_amount:     number
  type:           'normal' | 'turbo'
  pix_key:        string
  pix_key_type:   string
  status:         'pending' | 'processing' | 'completed' | 'rejected'
  rejection_note: string | null
  processed_at:   string | null
  created_at:     string
}

interface KycInfo {
  complete: boolean
  missing:  string[]
  pending:  string[]
  rejected: string[]
}

interface Props {
  balance: number
  kyc:     KycInfo
  history: Withdrawal[]
  limits:  { MIN_AMOUNT: number; TURBO_FEE: number }
}

const KYC_LABELS: Record<string, string> = {
  email:          'E-mail',
  phone:          'Telefone',
  identity_front: 'Documento (frente)',
  identity_back:  'Documento (verso)',
  selfie:         'Selfie',
}

const PIX_LABELS: Record<string, string> = {
  cpf:    'CPF',
  cnpj:   'CNPJ',
  email:  'E-mail',
  phone:  'Telefone',
  random: 'Chave aleatória',
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'Pendente',    cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  processing: { label: 'Processando', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
  completed:  { label: 'Concluído',   cls: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' },
  rejected:   { label: 'Rejeitado',   cls: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' },
}

export default function WithdrawalsClient({ balance, kyc, history, limits }: Props) {
  const router = useRouter()

  const [amount, setAmount]     = useState('')
  const [pixKey, setPixKey]     = useState('')
  const [pixType, setPixType]   = useState<'cpf' | 'cnpj' | 'email' | 'phone' | 'random'>('cpf')
  const [type, setType]         = useState<'normal' | 'turbo'>('normal')
  const [submitting, setSubmitting] = useState(false)

  const amountNum = parseFloat(amount.replace(',', '.')) || 0
  const fee       = type === 'turbo' ? limits.TURBO_FEE : 0
  const netAmount = Math.max(0, amountNum - fee)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!kyc.complete) {
      toast.error('Complete sua verificação de identidade primeiro.')
      return
    }
    if (amountNum < limits.MIN_AMOUNT) {
      toast.error(`Valor mínimo: R$ ${limits.MIN_AMOUNT.toFixed(2)}.`)
      return
    }
    if (amountNum > balance) {
      toast.error('Saldo insuficiente.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/withdrawals', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount:       amountNum,
          type,
          pix_key:      pixKey,
          pix_key_type: pixType,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao solicitar saque.')

      toast.success(
        type === 'turbo'
          ? 'Saque TURBO processado com sucesso!'
          : 'Solicitação criada! Será processada no próximo lote diário.',
      )
      setAmount('')
      setPixKey('')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao solicitar saque.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Saldo */}
      <Card className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-0">
        <p className="text-sm opacity-90">Saldo disponível</p>
        <p className="text-4xl font-bold mt-1">
          R$ {balance.toFixed(2).replace('.', ',')}
        </p>
      </Card>

      {/* KYC alert */}
      {!kyc.complete && (
        <Card className="p-4 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900">
          <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
            ⚠️ Verificação pendente
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Para realizar saques, você precisa concluir todas as etapas de verificação:
          </p>
          <ul className="text-sm space-y-1 mb-3">
            {[...kyc.missing, ...kyc.pending, ...kyc.rejected].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="text-amber-700 dark:text-amber-400">•</span>
                <span>{KYC_LABELS[t] ?? t}</span>
                {kyc.pending.includes(t) && (
                  <span className="text-xs text-blue-700 dark:text-blue-400">(em análise)</span>
                )}
                {kyc.rejected.includes(t) && (
                  <span className="text-xs text-red-700 dark:text-red-400">(rejeitado)</span>
                )}
              </li>
            ))}
          </ul>
          <Link href="/verificacao">
            <Button variant="default" size="sm">Completar verificação</Button>
          </Link>
        </Card>
      )}

      {/* Form */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4">Solicitar saque</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Valor (R$)</label>
            <Input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Mínimo R$ ${limits.MIN_AMOUNT.toFixed(2)}`}
              disabled={submitting || !kyc.complete}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="text-sm font-medium block mb-1">Tipo da chave</label>
              <Select
                value={pixType}
                onValueChange={(v) => setPixType(v as typeof pixType)}
                disabled={submitting || !kyc.complete}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PIX_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium block mb-1">Chave PIX</label>
              <Input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder={
                  pixType === 'cpf'    ? '000.000.000-00' :
                  pixType === 'cnpj'   ? '00.000.000/0000-00' :
                  pixType === 'email'  ? 'voce@email.com' :
                  pixType === 'phone'  ? '+55 11 99999-9999' :
                  'UUID'
                }
                disabled={submitting || !kyc.complete}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Velocidade</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('normal')}
                disabled={submitting || !kyc.complete}
                className={`p-3 rounded-lg border-2 text-left transition ${
                  type === 'normal'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'border-border hover:border-muted-foreground/50'
                }`}
              >
                <p className="font-medium">Normal</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sem taxa • processado em até 24h
                </p>
              </button>
              <button
                type="button"
                onClick={() => setType('turbo')}
                disabled={submitting || !kyc.complete}
                className={`p-3 rounded-lg border-2 text-left transition ${
                  type === 'turbo'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                    : 'border-border hover:border-muted-foreground/50'
                }`}
              >
                <p className="font-medium">TURBO ⚡</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Taxa R$ {limits.TURBO_FEE.toFixed(2)} • imediato
                </p>
              </button>
            </div>
          </div>

          {amountNum >= limits.MIN_AMOUNT && (
            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor solicitado:</span>
                <span>R$ {amountNum.toFixed(2)}</span>
              </div>
              {fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa TURBO:</span>
                  <span>− R$ {fee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-1 border-t">
                <span>Você receberá:</span>
                <span>R$ {netAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting || !kyc.complete || amountNum < limits.MIN_AMOUNT || amountNum > balance}
            className="w-full"
          >
            {submitting ? 'Processando...' : 'Solicitar saque'}
          </Button>
        </form>
      </Card>

      {/* Histórico */}
      <Card className="p-6">
        <h2 className="font-semibold mb-3">Histórico</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum saque solicitado ainda.</p>
        ) : (
          <div className="divide-y">
            {history.map((w) => {
              const status = STATUS_LABELS[w.status]
              return (
                <div key={w.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        R$ {Number(w.net_amount).toFixed(2)}
                      </span>
                      {w.type === 'turbo' && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                          TURBO
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.cls}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {PIX_LABELS[w.pix_key_type]}: {w.pix_key} •{' '}
                      {new Date(w.created_at).toLocaleString('pt-BR')}
                    </p>
                    {w.rejection_note && (
                      <p className="text-xs text-red-600 mt-1">{w.rejection_note}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
