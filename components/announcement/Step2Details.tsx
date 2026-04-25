'use client'

import { useState, useId } from 'react'
import { useWizardStore, PLANS, type Plan, type ItemVariation } from './wizard-store'
import type { Category } from '@/types'
import { z } from 'zod'

// ─── Schemas via Zod v4 ───────────────────────────────────────────────────────
const normalSchema = z.object({
  title:          z.string().min(5, 'Mínimo 5 caracteres').max(120, 'Máximo 120 caracteres'),
  description:    z.string().min(50, 'Mínimo 50 caracteres'),
  model:          z.literal('normal'),
  unit_price:     z.string().refine((v) => parseFloat(v) >= 2, 'Preço mínimo R$ 2,00'),
  stock_quantity: z.string().refine((v) => parseInt(v) >= 1, 'Estoque mínimo 1'),
})

const dynamicSchema = z.object({
  title:       z.string().min(5, 'Mínimo 5 caracteres').max(120, 'Máximo 120 caracteres'),
  description: z.string().min(50, 'Mínimo 50 caracteres'),
  model:       z.literal('dynamic'),
})

function getErrors(errors: Record<string, string[] | undefined>, field: string) {
  return errors[field]?.[0]
}

// ─── ItemVariations sub-component ────────────────────────────────────────────
function ItemVariations({
  variations,
  onChange,
}: {
  variations: ItemVariation[]
  onChange: (v: ItemVariation[]) => void
}) {
  const uid = useId()

  function add() {
    if (variations.length >= 20) return
    onChange([
      ...variations,
      { id: `${uid}-${Date.now()}`, title: '', unit_price: '', stock_quantity: '' },
    ])
  }

  function remove(id: string) {
    onChange(variations.filter((v) => v.id !== id))
  }

  function update(id: string, field: keyof Omit<ItemVariation, 'id'>, value: string) {
    onChange(variations.map((v) => (v.id === id ? { ...v, [field]: value } : v)))
  }

  function moveUp(idx: number) {
    if (idx === 0) return
    const next = [...variations]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    onChange(next)
  }

  function moveDown(idx: number) {
    if (idx === variations.length - 1) return
    const next = [...variations]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      {variations.map((v, idx) => (
        <div
          key={v.id}
          className="grid grid-cols-[auto_1fr_140px_120px_auto] items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3"
        >
          {/* Reorder */}
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => moveUp(idx)}
              disabled={idx === 0}
              className="text-zinc-600 hover:text-zinc-300 disabled:opacity-30"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => moveDown(idx)}
              disabled={idx === variations.length - 1}
              className="text-zinc-600 hover:text-zinc-300 disabled:opacity-30"
            >
              ▼
            </button>
          </div>

          {/* Title */}
          <input
            type="text"
            placeholder="Nome da variação"
            value={v.title}
            onChange={(e) => update(v.id, 'title', e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500"
          />

          {/* Price */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">R$</span>
            <input
              type="number"
              min="2"
              step="0.01"
              placeholder="0,00"
              value={v.unit_price}
              onChange={(e) => update(v.id, 'unit_price', e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 py-2 pl-8 pr-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500"
            />
          </div>

          {/* Stock */}
          <input
            type="number"
            min="1"
            placeholder="Qtd. estoque"
            value={v.stock_quantity}
            onChange={(e) => update(v.id, 'stock_quantity', e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500"
          />

          <button
            type="button"
            onClick={() => remove(v.id)}
            className="text-zinc-600 hover:text-red-400 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>
      ))}

      {variations.length < 2 && (
        <p className="text-xs text-yellow-400">⚠ Adicione pelo menos 2 variações.</p>
      )}

      <button
        type="button"
        onClick={add}
        disabled={variations.length >= 20}
        className="flex items-center gap-2 self-start rounded-xl border border-dashed border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 transition-all hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        + Adicionar variação
        <span className="text-xs text-zinc-600">({variations.length}/20)</span>
      </button>
    </div>
  )
}

// ─── Plan selector ───────────────────────────────────────────────────────────
function PlanSelector({ value, onChange }: { value: Plan; onChange: (p: Plan) => void }) {
  const colors: Record<Plan, string> = {
    silver:  'border-zinc-500 bg-zinc-500/10 text-zinc-300',
    gold:    'border-yellow-500 bg-yellow-500/10 text-yellow-300',
    diamond: 'border-cyan-400 bg-cyan-400/10 text-cyan-300',
  }
  const selected: Record<Plan, string> = {
    silver:  'ring-2 ring-zinc-400 shadow-lg shadow-zinc-500/10',
    gold:    'ring-2 ring-yellow-400 shadow-lg shadow-yellow-500/20',
    diamond: 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/20',
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {(Object.entries(PLANS) as [Plan, typeof PLANS[Plan]][]).map(([key, plan]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all ${colors[key]} ${value === key ? selected[key] : 'opacity-70 hover:opacity-100'}`}
        >
          <div className="flex items-center gap-2 font-semibold">
            <span className="text-xl">{plan.badge}</span>
            <span>{plan.label}</span>
          </div>
          <p className="text-xs leading-relaxed opacity-80">{plan.description}</p>
          <p className="mt-auto text-lg font-bold">{(plan.fee * 100).toFixed(0)}% taxa</p>
        </button>
      ))}
    </div>
  )
}

// ─── Custom Filters ───────────────────────────────────────────────────────────
function CustomFilters({
  schema,
  values,
  onChange,
}: {
  schema: Record<string, { label: string; type: 'text' | 'select'; options?: string[] }>
  values: Record<string, string>
  onChange: (v: Record<string, string>) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Object.entries(schema).map(([key, def]) => (
        <div key={key} className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">{def.label}</label>
          {def.type === 'select' && def.options ? (
            <select
              value={values[key] ?? ''}
              onChange={(e) => onChange({ ...values, [key]: e.target.value })}
              className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
            >
              <option value="">Selecione…</option>
              {def.options.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={values[key] ?? ''}
              onChange={(e) => onChange({ ...values, [key]: e.target.value })}
              className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Step 2 ──────────────────────────────────────────────────────────────────
interface Step2Props {
  category: Category | undefined
}

export function Step2Details({ category }: Step2Props) {
  const { draft, updateDraft, nextStep, prevStep } = useWizardStore()

  const [title, setTitle]             = useState(draft.title)
  const [description, setDesc]        = useState(draft.description)
  const [model, setModel]             = useState<'normal' | 'dynamic'>(draft.model)
  const [unit_price, setPrice]        = useState(draft.unit_price)
  const [stock_quantity, setStock]    = useState(draft.stock_quantity)
  const [variations, setVariations]   = useState<ItemVariation[]>(draft.variations)
  const [plan, setPlan]               = useState<Plan>(draft.plan)
  const [auto_delivery, setAuto]      = useState(draft.has_auto_delivery)
  const [filters_data, setFilters]    = useState<Record<string, string>>(draft.filters_data)
  const [errors, setErrors]           = useState<Record<string, string[] | undefined>>({})

  const customFilters = category?.custom_filters as Record<
    string,
    { label: string; type: 'text' | 'select'; options?: string[] }
  > | null

  function validate(): boolean {
    const data = { title, description, model, unit_price, stock_quantity }
    const schema = model === 'normal' ? normalSchema : dynamicSchema
    const result = schema.safeParse(data)
    if (!result.success) {
      // Use issues array to build a field-error map generically (avoids Zod v4 union type noise)
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString() ?? '_'
        if (!fieldErrors[key]) fieldErrors[key] = []
        fieldErrors[key].push(issue.message)
      }
      setErrors(fieldErrors)
      return false
    }
    if (model === 'dynamic') {
      if (variations.length < 2) {
        setErrors({ _: ['Adicione pelo menos 2 variações.'] })
        return false
      }
      const invalid = variations.some(
        (v) => !v.title || parseFloat(v.unit_price) < 2 || parseInt(v.stock_quantity) < 1,
      )
      if (invalid) {
        setErrors({ _: ['Todas as variações precisam de título, preço (≥ R$2) e estoque (≥ 1).'] })
        return false
      }
    }
    setErrors({})
    return true
  }

  function handleNext() {
    if (!validate()) return
    updateDraft({ title, description, model, unit_price, stock_quantity, variations, plan, has_auto_delivery: auto_delivery, filters_data })
    nextStep()
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Título */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ann-title" className="text-sm font-medium text-zinc-300">
          Título do anúncio <span className="text-zinc-500">({title.length}/120)</span>
        </label>
        <input
          id="ann-title"
          type="text"
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Conta Gold Nível 80 com skins raras"
          className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          aria-invalid={!!errors.title}
        />
        {errors.title && <p className="text-xs text-red-400">{errors.title[0]}</p>}
      </div>

      {/* Descrição */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ann-desc" className="text-sm font-medium text-zinc-300">
          Descrição <span className="text-zinc-500">({description.length} chars — mín. 50)</span>
        </label>
        <textarea
          id="ann-desc"
          rows={6}
          value={description}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Descreva detalhadamente o que o comprador irá receber..."
          className="resize-y rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          aria-invalid={!!errors.description}
        />
        {errors.description && <p className="text-xs text-red-400">{errors.description[0]}</p>}
      </div>

      {/* Modelo */}
      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-zinc-300">Tipo de anúncio</span>
        <div className="flex gap-3">
          {(['normal', 'dynamic'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModel(m)}
              className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                model === m
                  ? 'border-violet-500 bg-violet-600/20 text-violet-300'
                  : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {m === 'normal' ? '📦 Anúncio Normal' : '🎛 Com Variações (Dinâmico)'}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500">
          {model === 'normal'
            ? 'Um único produto com preço e estoque fixos.'
            : 'Múltiplas variações (ex: servidores diferentes, planos diferentes) com preços individuais.'}
        </p>
      </div>

      {/* Campos de preço/estoque (normal) */}
      {model === 'normal' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ann-price" className="text-sm font-medium text-zinc-300">Preço (R$)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">R$</span>
              <input
                id="ann-price"
                type="number"
                min="2"
                step="0.01"
                placeholder="0,00"
                value={unit_price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 py-3 pl-9 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500"
                aria-invalid={!!errors.unit_price}
              />
            </div>
            {errors.unit_price && <p className="text-xs text-red-400">{errors.unit_price[0]}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ann-stock" className="text-sm font-medium text-zinc-300">Estoque</label>
            <input
              id="ann-stock"
              type="number"
              min="1"
              placeholder="1"
              value={stock_quantity}
              onChange={(e) => setStock(e.target.value)}
              className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500"
              aria-invalid={!!errors.stock_quantity}
            />
            {errors.stock_quantity && <p className="text-xs text-red-400">{errors.stock_quantity[0]}</p>}
          </div>
        </div>
      )}

      {/* Variações (dynamic) */}
      {model === 'dynamic' && (
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-zinc-300">Variações</span>
          <ItemVariations variations={variations} onChange={setVariations} />
        </div>
      )}

      {/* Erro geral */}
      {errors._ && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{errors._[0]}</p>}

      {/* Plano */}
      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-zinc-300">Plano do anúncio</span>
        <PlanSelector value={plan} onChange={setPlan} />
      </div>

      {/* Auto-delivery toggle */}
      <div className="flex items-start gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <button
          type="button"
          role="switch"
          aria-checked={auto_delivery}
          onClick={() => setAuto((v) => !v)}
          className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
            auto_delivery ? 'bg-violet-600' : 'bg-zinc-700'
          }`}
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              auto_delivery ? 'left-6' : 'left-1'
            }`}
          />
        </button>
        <div>
          <p className="text-sm font-medium text-zinc-200">⚡ Ativar Entrega Automática</p>
          <p className="mt-1 text-xs text-zinc-500">
            Cadastre as credenciais no próximo passo e o comprador as receberá instantaneamente após o pagamento, sem necessidade de intervenção manual.
          </p>
        </div>
      </div>

      {/* Filtros customizados */}
      {customFilters && Object.keys(customFilters).length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-zinc-300">Filtros da categoria</span>
          <CustomFilters schema={customFilters} values={filters_data} onChange={setFilters} />
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-600 hover:text-white"
        >
          ← Voltar
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-violet-500"
        >
          Próximo →
        </button>
      </div>
    </div>
  )
}
