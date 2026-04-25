import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ─── Plan config ─────────────────────────────────────────────────────────────
export const PLANS = {
  silver: { label: 'Prata', fee: 0.12, badge: '🥈', color: 'zinc', description: '12% de taxa por venda. Até 3 imagens.' },
  gold:   { label: 'Ouro',  fee: 0.10, badge: '🥇', color: 'yellow', description: '10% de taxa por venda. Até 6 imagens. Destaque na busca.' },
  diamond:{ label: 'Diamante', fee: 0.08, badge: '💎', color: 'cyan', description: '8% de taxa por venda. Até 8 imagens. Topo da busca + badge VIP.' },
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
