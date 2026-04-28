import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ─── Plan config ─────────────────────────────────────────────────────────────
// Fees aligned with lib/mercadopago/client.ts (env: MP_MARKETPLACE_FEE_*).
export const PLANS = {
  silver:  { label: 'Prata',    fee: 0.0999, badge: '🥈', color: 'zinc',   tag: null,                      description: 'Anúncio básico. Posição orgânica por vendas.' },
  gold:    { label: 'Ouro',     fee: 0.1199, badge: '🥇', color: 'amber',  tag: { text: 'POPULAR', tone: 'amber' as const },  description: 'Destaque na seção “Mais Vistos” da categoria.' },
  diamond: { label: 'Diamante', fee: 0.1299, badge: '💎', color: 'violet', tag: { text: 'TOP',     tone: 'violet' as const }, description: 'Máxima visibilidade. Aparece em “Em Destaque” na home.' },
} as const

export type Plan = keyof typeof PLANS

// ─── Item variation ───────────────────────────────────────────────────────────
export interface ItemVariation {
  id: string
  title: string
  unit_price: string
  stock_quantity: string
}

// ─── Wizard state ─────────────────────────────────────────────────────────────
export interface WizardDraft {
  // step 1
  root_category_id: string
  root_category_name: string
  category_id: string
  category_name: string

  // step 2
  title: string
  description: string
  model: 'normal' | 'dynamic'
  unit_price: string
  stock_quantity: string
  variations: ItemVariation[]
  plan: Plan
  has_auto_delivery: boolean
  filters_data: Record<string, string>

  // step 3 (stored as data URLs for localStorage preview; actual Files held in memory)
  cover_preview: string | null
  gallery_previews: string[]
}

interface WizardState {
  step: number
  draft: WizardDraft
  setStep: (s: number) => void
  nextStep: () => void
  prevStep: () => void
  updateDraft: (update: Partial<WizardDraft>) => void
  resetDraft: () => void
}

const INITIAL_DRAFT: WizardDraft = {
  root_category_id: '',
  root_category_name: '',
  category_id: '',
  category_name: '',
  title: '',
  description: '',
  model: 'normal',
  unit_price: '',
  stock_quantity: '',
  variations: [],
  plan: 'silver',
  has_auto_delivery: false,
  filters_data: {},
  cover_preview: null,
  gallery_previews: [],
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      step: 1,
      draft: INITIAL_DRAFT,
      setStep: (s) => set({ step: s }),
      nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 4) })),
      prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),
      updateDraft: (update) =>
        set((state) => ({ draft: { ...state.draft, ...update } })),
      resetDraft: () => set({ step: 1, draft: INITIAL_DRAFT }),
    }),
    {
      name: 'wizard-draft',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
