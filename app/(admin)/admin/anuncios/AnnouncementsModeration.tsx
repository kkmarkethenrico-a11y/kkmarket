'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { AnnouncementPlan, AnnouncementStatus } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────
interface SellerProfile {
  id:           string
  username:     string
  display_name: string | null
  avatar_url:   string | null
}

interface SellerStats {
  reviews_positive: number
  reviews_neutral:  number
  reviews_negative: number
  total_sales:      number
}

interface AnnImage {
  url:       string
  is_cover:  boolean
  sort_order: number
}

interface AnnItem {
  id:               string
  title:            string
  slug:             string
  description:      string
  model:            'normal' | 'dynamic'
  plan:             AnnouncementPlan
  unit_price:       number | null
  stock_quantity:   number | null
  status:           AnnouncementStatus
  rejection_reason: string | null
  approved_at:      string | null
  created_at:       string
  updated_at:       string
  has_auto_delivery: boolean
  sale_count:       number
  profiles:         SellerProfile | null
  user_stats:       SellerStats | null
  categories:       { id: string; name: string } | null
  announcement_images: AnnImage[]
}

interface Props {
  items:        AnnItem[]
  total:        number
  currentTab:   string
  pendingCount: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PLAN_COLORS: Record<AnnouncementPlan, string> = {
  silver:  'bg-gray-200 text-gray-800',
  gold:    'bg-amber-200 text-amber-900',
  diamond: 'bg-blue-200 text-blue-900',
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Pendente',  cls: 'bg-amber-100 text-amber-800' },
  active:    { label: 'Ativo',     cls: 'bg-green-100 text-green-800' },
  paused:    { label: 'Pausado',   cls: 'bg-gray-200 text-gray-700' },
  rejected:  { label: 'Reprovado', cls: 'bg-red-100 text-red-800' },
  sold_out:  { label: 'Esgotado',  cls: 'bg-orange-100 text-orange-800' },
  deleted:   { label: 'Excluído',  cls: 'bg-gray-100 text-gray-500' },
}

const TABS = [
  { value: 'pending',  label: 'Pendentes' },
  { value: 'active',   label: 'Ativos' },
  { value: 'paused',   label: 'Pausados' },
  { value: 'rejected', label: 'Reprovados' },
] as const

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AnnouncementsModeration({
  items,
  total,
  currentTab,
  pendingCount,
}: Props) {
  const router = useRouter()

  const [selected, setSelected]     = useState<AnnItem | null>(null)
  const [modalMode, setModalMode]   = useState<'review' | 'reject' | 'edit'>('review')
  const [rejectReason, setRejectReason] = useState('')
  const [editTitle, setEditTitle]   = useState('')
  const [editDesc, setEditDesc]     = useState('')
  const [editPrice, setEditPrice]   = useState('')
  const [editStock, setEditStock]   = useState('')
  const [busy, setBusy]             = useState(false)

  function openModal(item: AnnItem) {
    setSelected(item)
    setModalMode('review')
    setRejectReason('')
    setEditTitle(item.title)
    setEditDesc(item.description)
    setEditPrice(item.unit_price?.toString() ?? '')
    setEditStock(item.stock_quantity?.toString() ?? '')
  }

  function closeModal() { setSelected(null) }

  function changeTab(tab: string) {
    router.push(`/admin/anuncios?tab=${tab}`)
  }

  async function moderate(action: 'approve' | 'reject' | 'edit_approve') {
    if (!selected) return
    setBusy(true)
    try {
      const body: Record<string, unknown> = { action }
      if (action === 'reject')       body.rejection_reason = rejectReason
      if (action === 'edit_approve') body.edits = {
        ...(editTitle !== selected.title             ? { title:          editTitle } : {}),
        ...(editDesc  !== selected.description       ? { description:    editDesc  } : {}),
        ...(editPrice && Number(editPrice) !== selected.unit_price
                                                    ? { unit_price:     Number(editPrice) } : {}),
        ...(editStock && Number(editStock) !== selected.stock_quantity
                                                    ? { stock_quantity: Number(editStock) } : {}),
      }

      const res  = await fetch(`/api/admin/announcements/${selected.id}/moderate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha.')

      const label = action === 'reject' ? 'reprovado' : 'aprovado'
      toast.success(`Anúncio ${label} com sucesso.`)
      closeModal()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro.')
    } finally {
      setBusy(false)
    }
  }

  const coverUrl = (item: AnnItem) =>
    item.announcement_images.find((i) => i.is_cover)?.url ??
    item.announcement_images.sort((a, b) => a.sort_order - b.sort_order)[0]?.url ??
    null

  const repPct = (s: SellerStats | null) => {
    if (!s) return null
    const total = s.reviews_positive + s.reviews_neutral + s.reviews_negative
    if (!total) return null
    return Math.round((s.reviews_positive / total) * 100)
  }

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => changeTab(t.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              t.value === currentTab
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {t.label}
            {t.value === 'pending' && pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center size-5 rounded-full bg-red-500 text-white text-xs">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground self-center">
          {total} anúncio(s)
        </span>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3">Anúncio</th>
              <th className="p-3">Vendedor</th>
              <th className="p-3">Categoria</th>
              <th className="p-3">Preço</th>
              <th className="p-3">Plano</th>
              <th className="p-3">Enviado</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  Nenhum anúncio nesta aba.
                </td>
              </tr>
            ) : items.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30">
                <td className="p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {coverUrl(item) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverUrl(item)!}
                        alt={item.title}
                        className="size-10 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate max-w-[200px]">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.model}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <p className="font-medium">@{item.profiles?.username ?? '?'}</p>
                  {(() => {
                    const pct = repPct(item.user_stats)
                    return pct !== null ? (
                      <p className="text-xs text-muted-foreground">{pct}% positivo</p>
                    ) : null
                  })()}
                </td>
                <td className="p-3 text-muted-foreground">
                  {item.categories?.name ?? '—'}
                </td>
                <td className="p-3">
                  {item.unit_price != null
                    ? `R$ ${Number(item.unit_price).toFixed(2)}`
                    : <span className="text-muted-foreground">Dinâmico</span>}
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${PLAN_COLORS[item.plan]}`}>
                    {item.plan}
                  </span>
                </td>
                <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(item.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="p-3 text-right">
                  <Button size="sm" onClick={() => openModal(item)}>
                    Revisar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Review modal */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) closeModal() }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="truncate">{selected.title}</DialogTitle>
              </DialogHeader>

              {/* Seller info bar */}
              <div className="flex items-center gap-4 rounded-lg bg-muted p-3">
                {selected.profiles?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.profiles.avatar_url}
                    alt="avatar"
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="size-10 rounded-full bg-muted-foreground/20 flex items-center justify-center text-lg">
                    {(selected.profiles?.display_name ?? selected.profiles?.username ?? '?')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {selected.profiles?.display_name ?? `@${selected.profiles?.username}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{selected.profiles?.username}
                    {selected.user_stats && (() => {
                      const pct = repPct(selected.user_stats)
                      return pct !== null
                        ? ` · ${pct}% positivo · ${selected.user_stats.total_sales} vendas`
                        : ''
                    })()}
                  </p>
                </div>
                <div className="ml-auto flex gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-1 rounded ${STATUS_LABELS[selected.status]?.cls ?? ''}`}>
                    {STATUS_LABELS[selected.status]?.label}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${PLAN_COLORS[selected.plan]}`}>
                    {selected.plan}
                  </span>
                </div>
              </div>

              {/* Images */}
              {selected.announcement_images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[...selected.announcement_images]
                    .sort((a, b) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0) || a.sort_order - b.sort_order)
                    .map((img) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={img.url}
                        src={img.url}
                        alt="imagem"
                        className={`h-32 w-auto rounded object-cover shrink-0 ${img.is_cover ? 'ring-2 ring-primary' : ''}`}
                      />
                    ))}
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Categoria</p>
                  <p>{selected.categories?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Modelo</p>
                  <p>{selected.model}</p>
                </div>
                {selected.unit_price != null && (
                  <div>
                    <p className="text-muted-foreground text-xs">Preço</p>
                    <p className="font-semibold">R$ {Number(selected.unit_price).toFixed(2)}</p>
                  </div>
                )}
                {selected.stock_quantity != null && (
                  <div>
                    <p className="text-muted-foreground text-xs">Estoque</p>
                    <p>{selected.stock_quantity}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs">Entrega automática</p>
                  <p>{selected.has_auto_delivery ? 'Sim' : 'Não'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Enviado em</p>
                  <p>{new Date(selected.created_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                <div className="rounded bg-muted p-3 text-sm max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {selected.description}
                </div>
              </div>

              {/* Edit form */}
              {modalMode === 'edit' && (
                <div className="space-y-3 border rounded-lg p-4">
                  <p className="font-medium text-sm">Editar antes de aprovar</p>
                  <div>
                    <label className="text-xs text-muted-foreground">Título</label>
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Descrição</label>
                    <Textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={5}
                    />
                  </div>
                  {selected.model === 'normal' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Preço (R$)</label>
                        <Input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Estoque</label>
                        <Input
                          type="number"
                          value={editStock}
                          onChange={(e) => setEditStock(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reject reason */}
              {modalMode === 'reject' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Motivo da reprovação (obrigatório)</label>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Descreva o motivo detalhado. O vendedor receberá esta mensagem por e-mail."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">{rejectReason.length}/1000</p>
                </div>
              )}

              <DialogFooter className="flex flex-wrap gap-2 pt-2">
                {modalMode === 'review' && selected.status === 'pending' && (
                  <>
                    <Button variant="ghost" size="sm" onClick={closeModal}>
                      Fechar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setModalMode('edit')}
                    >
                      Editar e aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setModalMode('reject')}
                    >
                      Reprovar
                    </Button>
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => moderate('approve')}
                    >
                      {busy ? 'Aprovando...' : '✅ Aprovar'}
                    </Button>
                  </>
                )}

                {modalMode === 'reject' && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setModalMode('review')}>
                      Voltar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={busy || rejectReason.trim().length < 10}
                      onClick={() => moderate('reject')}
                    >
                      {busy ? 'Reprovando...' : 'Confirmar reprovação'}
                    </Button>
                  </>
                )}

                {modalMode === 'edit' && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setModalMode('review')}>
                      Voltar
                    </Button>
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => moderate('edit_approve')}
                    >
                      {busy ? 'Salvando...' : '✅ Salvar e aprovar'}
                    </Button>
                  </>
                )}

                {selected.status !== 'pending' && (
                  <Button variant="ghost" size="sm" onClick={closeModal}>
                    Fechar
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
