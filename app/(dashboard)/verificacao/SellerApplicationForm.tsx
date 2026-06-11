'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type DocKey = 'identityFront' | 'identityBack' | 'selfie'

const DOC_LABELS: Record<DocKey, { title: string; desc: string }> = {
  identityFront: { title: 'Documento — Frente',  desc: 'RG ou CNH (frente). JPG, PNG, WEBP ou PDF até 10MB.' },
  identityBack:  { title: 'Documento — Verso',   desc: 'RG ou CNH (verso). JPG, PNG, WEBP ou PDF até 10MB.' },
  selfie:        { title: 'Selfie com documento', desc: 'Foto sua segurando o documento ao lado do rosto.' },
}

export function SellerApplicationForm() {
  const router = useRouter()
  const [files, setFiles] = useState<Record<DocKey, File | null>>({
    identityFront: null,
    identityBack: null,
    selfie: null,
  })
  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setFile(key: DocKey, f: File | null) {
    setFiles((s) => ({ ...s, [key]: f }))
  }

  async function uploadOne(file: File): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('bucket', 'kyc-docs')
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Falha no upload')
    return json.url as string
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!files.identityFront || !files.identityBack || !files.selfie) {
      setError('Envie os 3 documentos.')
      return
    }

    setBusy(true)
    try {
      const [identityFrontUrl, identityBackUrl, selfieUrl] = await Promise.all([
        uploadOne(files.identityFront),
        uploadOne(files.identityBack),
        uploadOne(files.selfie),
      ])

      const res = await fetch('/api/seller-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identityFrontUrl, identityBackUrl, selfieUrl }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Falha ao enviar')

      router.refresh()
    } catch (err: any) {
      setError(err.message ?? 'Erro inesperado')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(['identityFront', 'identityBack', 'selfie'] as DocKey[]).map((k) => (
        <FileSlot
          key={k}
          title={DOC_LABELS[k].title}
          desc={DOC_LABELS[k].desc}
          file={files[k]}
          onChange={(f) => setFile(k, f)}
        />
      ))}

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-[var(--gm-violet)] px-6 py-3 text-sm font-black text-[#1a1126] transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed gm-glow"
      >
        {busy ? 'Enviando...' : 'Enviar para análise'}
      </button>
    </form>
  )
}

function FileSlot({
  title, desc, file, onChange,
}: {
  title: string
  desc: string
  file: File | null
  onChange: (f: File | null) => void
}) {
  return (
    <label className="block cursor-pointer rounded-2xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-2)] p-4 hover:border-[var(--gm-violet)] transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--gm-ink)]">{title}</p>
          <p className="mt-0.5 text-xs text-[var(--gm-ink-faint)]">{desc}</p>
          {file && (
            <p className="mt-2 truncate text-xs font-bold text-[var(--gm-violet)]">📎 {file.name}</p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-[var(--gm-paper-3)] border border-[var(--gm-ink-faint)]/30 px-3 py-1 text-xs font-bold text-[var(--gm-ink)]">
          {file ? 'Trocar' : 'Selecionar'}
        </span>
      </div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  )
}
