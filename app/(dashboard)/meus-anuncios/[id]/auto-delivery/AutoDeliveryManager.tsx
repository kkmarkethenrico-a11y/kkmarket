'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

interface Item {
  id: string
  item_id: string | null
  is_delivered: boolean
  order_id: string | null
  created_at: string
}

interface Counts {
  total: number
  delivered: number
  available: number
}

interface Props {
  announcementId: string
}

export default function AutoDeliveryManager({ announcementId }: Props) {
  const [items, setItems]       = useState<Item[]>([])
  const [counts, setCounts]     = useState<Counts>({ total: 0, delivered: 0, available: 0 })
  const [loading, setLoading]   = useState(true)
  const [textarea, setTextarea] = useState('')
  const [saving, setSaving]     = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/announcements/${announcementId}/auto-delivery`, {
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao carregar.')
      setItems(data.items ?? [])
      setCounts(data.counts ?? { total: 0, delivered: 0, available: 0 })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar.')
    } finally {
      setLoading(false)
    }
  }, [announcementId])

  useEffect(() => { reload() }, [reload])

  async function handleSave() {
    const lines = textarea
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    if (lines.length === 0) {
      toast.error('Cole ao menos uma credencial.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/announcements/${announcementId}/auto-delivery`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ payloads: lines }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar.')
      toast.success(`${data.added} credencial(is) adicionada(s).`)
      setTextarea('')
      await reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(itemId: string) {
    if (!confirm('Remover esta credencial?')) return
    try {
      const res = await fetch(`/api/announcements/${announcementId}/auto-delivery`, {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ item_id: itemId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao remover.')
      toast.success('Item removido.')
      await reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase">Disponíveis</p>
          <p className="text-3xl font-bold text-green-600">{counts.available}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase">Entregues</p>
          <p className="text-3xl font-bold">{counts.delivered}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase">Total</p>
          <p className="text-3xl font-bold">{counts.total}</p>
        </Card>
      </div>

      {/* Form de adicionar */}
      <Card className="p-6">
        <h2 className="font-semibold mb-2">Adicionar credenciais</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Cole uma credencial por linha. Cada linha será criptografada e
          armazenada como um item independente.
        </p>
        <Textarea
          value={textarea}
          onChange={(e) => setTextarea(e.target.value)}
          placeholder={'usuario1@email.com:senha123\nusuario2@email.com:senha456\n...'}
          rows={8}
          className="font-mono text-sm"
          disabled={saving}
        />
        <div className="flex justify-between items-center mt-3">
          <span className="text-xs text-muted-foreground">
            {textarea.split('\n').filter((s) => s.trim()).length} linha(s) detectada(s)
          </span>
          <Button onClick={handleSave} disabled={saving || !textarea.trim()}>
            {saving ? 'Salvando...' : 'Salvar credenciais'}
          </Button>
        </div>
      </Card>

      {/* Lista */}
      <Card className="p-6">
        <h2 className="font-semibold mb-3">Estoque atual</h2>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma credencial cadastrada ainda.
          </p>
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="font-mono text-muted-foreground">••••••••••••</span>
                  {item.is_delivered ? (
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-200 dark:bg-gray-800 text-muted-foreground">
                      Entregue
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400">
                      Disponível
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {!item.is_delivered && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remover
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
