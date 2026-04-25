'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface Item {
  id:             string
  user_id:        string
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
  profiles?: {
    id:           string
    username:     string
    display_name: string | null
    email:        string | null
  } | null
}

interface Props {
  items: Item[]
  currentStatus: string
}

const STATUS_OPTIONS = [
  { value: 'pending',    label: 'Pendentes' },
  { value: 'processing', label: 'Processando' },
  { value: 'completed',  label: 'Concluídos' },
  { value: 'rejected',   label: 'Rejeitados' },
  { value: 'all',        label: 'Todos' },
]

export default function AdminWithdrawalsClient({ items, currentStatus }: Props) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const [note, setNote] = useState('')

  function changeStatus(s: string) {
    const params = new URLSearchParams()
    params.set('status', s)
    router.push(`/admin/financeiro?${params.toString()}`)
  }

  async function decide(id: string, action: 'approve' | 'reject', noteText?: string) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/decision`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action, note: noteText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha.')
      toast.success(action === 'approve' ? 'Saque aprovado e processado.' : 'Saque rejeitado.')
      setNoteFor(null)
      setNote('')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      {/* Filtro */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((o) => (
          <Button
            key={o.value}
            size="sm"
            variant={o.value === currentStatus ? 'default' : 'outline'}
            onClick={() => changeStatus(o.value)}
          >
            {o.label}
          </Button>
        ))}
      </div>

      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-left">
              <th className="p-3">Usuário</th>
              <th className="p-3">Valor</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">PIX</th>
              <th className="p-3">Status</th>
              <th className="p-3">Solicitado</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  Nenhum saque para mostrar.
                </td>
              </tr>
            ) : items.map((w) => (
              <tr key={w.id}>
                <td className="p-3">
                  <div className="font-medium">
                    {w.profiles?.display_name ?? w.profiles?.username ?? '—'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    @{w.profiles?.username ?? '?'}
                  </div>
                </td>
                <td className="p-3">
                  <div>R$ {Number(w.net_amount).toFixed(2)}</div>
                  {Number(w.fee) > 0 && (
                    <div className="text-xs text-muted-foreground">
                      (taxa R$ {Number(w.fee).toFixed(2)})
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    w.type === 'turbo'
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-gray-200 text-gray-800'
                  }`}>
                    {w.type === 'turbo' ? 'TURBO' : 'NORMAL'}
                  </span>
                </td>
                <td className="p-3 text-xs">
                  <div className="font-medium">{w.pix_key_type}</div>
                  <div className="text-muted-foreground truncate max-w-[180px]">{w.pix_key}</div>
                </td>
                <td className="p-3">
                  <span className="text-xs px-2 py-0.5 rounded bg-muted">
                    {w.status}
                  </span>
                  {w.rejection_note && (
                    <div className="text-xs text-red-600 mt-1">{w.rejection_note}</div>
                  )}
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {new Date(w.created_at).toLocaleString('pt-BR')}
                </td>
                <td className="p-3 text-right">
                  {(w.status === 'pending' || w.status === 'processing') && (
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        disabled={busyId === w.id}
                        onClick={() => decide(w.id, 'approve')}
                      >
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === w.id}
                        onClick={() => { setNoteFor(w.id); setNote('') }}
                      >
                        Rejeitar
                      </Button>
                    </div>
                  )}
                  {noteFor === w.id && (
                    <div className="mt-2 flex flex-col gap-2 items-end">
                      <Input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Motivo da rejeição"
                        className="text-sm"
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setNoteFor(null); setNote('') }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={!note.trim() || busyId === w.id}
                          onClick={() => decide(w.id, 'reject', note.trim())}
                        >
                          Confirmar rejeição
                        </Button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}
