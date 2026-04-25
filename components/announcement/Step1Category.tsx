'use client'

import { useState } from 'react'
import { useWizardStore } from './wizard-store'
import type { Category } from '@/types'

interface Step1Props {
  categories: Category[]
}

export function Step1Category({ categories }: Step1Props) {
  const { draft, updateDraft, nextStep } = useWizardStore()
  const [localRoot, setLocalRoot] = useState(draft.root_category_id)
  const [localSub, setLocalSub]   = useState(draft.category_id)

  const roots = categories.filter((c) => c.parent_id === null)
  const subcategories = categories.filter((c) => c.parent_id === localRoot)

  const canAdvance = localRoot !== '' && localSub !== ''

  function handleAdvance() {
    const root = roots.find((r) => r.id === localRoot)!
    const sub  = subcategories.find((s) => s.id === localSub)!
    updateDraft({
      root_category_id: localRoot,
      root_category_name: root.name,
      category_id:  localSub,
      category_name: sub.name,
      filters_data: {},
    })
    nextStep()
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Root categories */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">
          Escolha a categoria principal
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {roots.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setLocalRoot(cat.id)
                setLocalSub('')
              }}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-sm font-medium transition-all ${
                localRoot === cat.id
                  ? 'border-violet-500 bg-violet-600/20 text-violet-300 shadow-lg shadow-violet-500/10'
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700 hover:text-white'
              }`}
            >
              <span className="text-2xl">{catEmoji(cat.slug)}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Subcategories */}
      {localRoot && subcategories.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-zinc-100">
            Escolha o jogo / subcategoria
          </h2>
          <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4">
            {subcategories.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setLocalSub(sub.id)}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all ${
                  localSub === sub.id
                    ? 'border-violet-500 bg-violet-600/20 text-violet-300'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700 hover:text-white'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {localRoot && subcategories.length === 0 && (
        <p className="rounded-xl bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
          Esta categoria não possui subcategorias. Selecione outra.
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!canAdvance}
          onClick={handleAdvance}
          className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Próximo →
        </button>
      </div>
    </div>
  )
}

function catEmoji(slug: string): string {
  const map: Record<string, string> = {
    jogos: '🎮',
    'redes-sociais': '📱',
    bots: '🤖',
    scripts: '💻',
    'outros-digitais': '📦',
  }
  return map[slug] ?? '📂'
}
