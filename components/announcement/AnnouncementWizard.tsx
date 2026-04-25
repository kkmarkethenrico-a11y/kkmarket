'use client'

import { useWizardStore } from '@/components/announcement/wizard-store'
import { Step1Category } from '@/components/announcement/Step1Category'
import { Step2Details } from '@/components/announcement/Step2Details'
import { Step3Images } from '@/components/announcement/Step3Images'
import { Step4Review } from '@/components/announcement/Step4Review'
import type { Category } from '@/types'

const STEPS = [
  { n: 1, label: 'Categoria' },
  { n: 2, label: 'Detalhes'  },
  { n: 3, label: 'Imagens'   },
  { n: 4, label: 'Revisão'   },
] as const

interface AnnouncementWizardProps {
  categories: Category[]
}

export function AnnouncementWizard({ categories }: AnnouncementWizardProps) {
  const { step, draft } = useWizardStore()

  const currentCategory = categories.find((c) => c.id === draft.category_id)

  return (
    <div className="mx-auto max-w-3xl pb-16">

      {/* ─── Progress bar ─────────────────────────────────────────────────── */}
      <div className="mb-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          {STEPS.map(({ n, label }) => {
            const done    = n < step
            const current = n === step
            return (
              <div key={n} className="flex flex-1 flex-col items-center gap-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ring-2 transition-all ${
                  done    ? 'bg-violet-600 text-white ring-violet-600' :
                  current ? 'bg-violet-600/20 text-violet-400 ring-violet-500' :
                            'bg-zinc-900 text-zinc-600 ring-zinc-800'
                }`}>
                  {done ? '✓' : n}
                </div>
                <span className={`hidden text-xs font-medium sm:block ${
                  current ? 'text-violet-300' : done ? 'text-zinc-400' : 'text-zinc-600'
                }`}>
                  {label}
                </span>
              </div>
            )
          })}

          {/* Connecting lines */}
          <style>{`
            .steps-container { display: contents; }
            .steps-container > div:not(:last-child)::after {
              content: '';
              position: absolute;
              top: 18px;
              left: 50%;
              width: 100%;
              height: 2px;
              background: currentColor;
            }
          `}</style>
        </div>

        {/* Linear progress */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-500"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        <p className="text-center text-xs text-zinc-500">
          Passo {step} de {STEPS.length} — {STEPS[step - 1].label}
        </p>
      </div>

      {/* ─── Step content ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-xl backdrop-blur-sm sm:p-8">
        {step === 1 && <Step1Category categories={categories} />}
        {step === 2 && <Step2Details  category={currentCategory} />}
        {step === 3 && <Step3Images />}
        {step === 4 && <Step4Review   categories={categories} />}
      </div>
    </div>
  )
}
