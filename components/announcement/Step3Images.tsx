'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useWizardStore } from './wizard-store'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_COVER_BYTES = 2 * 1024 * 1024   // 2 MB
const MAX_GALLERY_BYTES = 1 * 1024 * 1024 // 1 MB
const MAX_GALLERY = 8

// ─── helpers ─────────────────────────────────────────────────────────────────
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

async function uploadToStorage(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  form.append('bucket', 'announcement-images')
  const res = await fetch('/api/upload', { method: 'POST', body: form })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error ?? 'Falha no upload')
  }
  const { url } = await res.json()
  return url as string
}

// ─── Image drop zone ─────────────────────────────────────────────────────────
function DropZone({
  label,
  accept,
  maxSize,
  onFile,
  preview,
  onClear,
}: {
  label: string
  accept: string
  maxSize: number
  onFile: (file: File) => void
  preview: string | null
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function validate(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) return 'Apenas JPEG, PNG ou WebP são aceitos.'
    if (file.size > maxSize) return `Tamanho máximo: ${maxSize / 1024 / 1024} MB.`
    return null
  }

  function handleFile(file: File) {
    const err = validate(file)
    if (err) { setError(err); return }
    setError(null)
    onFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  return (
    <div className="flex flex-col gap-2">
      {preview ? (
        <div className="relative overflow-hidden rounded-2xl border border-[var(--gm-ink-faint)]/30">
          <div className="relative aspect-video w-full">
            <Image src={preview} alt="Preview" fill className="object-cover" />
          </div>
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-2 rounded-full bg-[var(--gm-paper-2)]/80 px-3 py-1 text-xs font-medium text-[var(--gm-ink)] backdrop-blur hover:bg-red-500/80"
          >
            Remover
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-12 transition-all ${
            dragging ? 'border-[var(--gm-violet)] bg-[var(--gm-violet)]/10' : 'border-[var(--gm-ink-faint)]/30 bg-[var(--gm-paper-2)]/40 hover:border-zinc-600'
          }`}
        >
          <span className="text-3xl">🖼</span>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--gm-ink)]">{label}</p>
            <p className="mt-1 text-xs text-[var(--gm-ink-faint)]/80">
              Arraste ou clique · JPEG, PNG, WebP · máx. {maxSize / 1024 / 1024} MB
            </p>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ─── Step 3 ──────────────────────────────────────────────────────────────────
export function Step3Images() {
  const { draft, updateDraft, nextStep, prevStep } = useWizardStore()

  const [coverFile, setCoverFile]         = useState<File | null>(null)
  const [coverPreview, setCoverPreview]   = useState<string | null>(draft.cover_preview)
  const [galleryFiles, setGalleryFiles]   = useState<File[]>([])
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(draft.gallery_previews)
  const [uploading, setUploading]         = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  async function handleCoverFile(file: File) {
    setCoverFile(file)
    const url = await fileToDataUrl(file)
    setCoverPreview(url)
    updateDraft({ cover_preview: url })
  }

  async function handleGalleryFiles(files: FileList) {
    const remaining = MAX_GALLERY - galleryFiles.length - galleryPreviews.filter(Boolean).length
    const toAdd = Array.from(files).slice(0, remaining)
    const newFiles = [...galleryFiles, ...toAdd]
    setGalleryFiles(newFiles)
    const previews = await Promise.all(toAdd.map(fileToDataUrl))
    const updated = [...galleryPreviews, ...previews]
    setGalleryPreviews(updated)
    updateDraft({ gallery_previews: updated })
  }

  function removeGallery(idx: number) {
    const newFiles = galleryFiles.filter((_, i) => i !== idx)
    const newPreviews = galleryPreviews.filter((_, i) => i !== idx)
    setGalleryFiles(newFiles)
    setGalleryPreviews(newPreviews)
    updateDraft({ gallery_previews: newPreviews })
  }

  function moveGallery(from: number, to: number) {
    const nf = [...galleryFiles]
    const np = [...galleryPreviews]
    const [ff] = nf.splice(from, 1)
    const [fp] = np.splice(from, 1)
    nf.splice(to, 0, ff)
    np.splice(to, 0, fp)
    setGalleryFiles(nf)
    setGalleryPreviews(np)
    updateDraft({ gallery_previews: np })
  }

  async function handleNext() {
    if (!coverFile && !coverPreview) {
      setError('A imagem de capa é obrigatória.')
      return
    }
    setError(null)
    setUploading(true)

    try {
      // Upload cover if new file selected
      let coverUrl = coverPreview!
      if (coverFile) {
        coverUrl = await uploadToStorage(coverFile)
      }

      // Upload gallery files
      const existingUrls = galleryPreviews.filter((p) => p.startsWith('http'))
      const newPreviews = galleryPreviews.filter((p) => !p.startsWith('http'))
      const uploadedUrls = await Promise.all(
        galleryFiles.map(async (file, i) => {
          if (galleryPreviews[i]?.startsWith('http')) return galleryPreviews[i]
          return uploadToStorage(file)
        }),
      )

      // Save uploaded URLs to draft and proceed
      updateDraft({
        cover_preview: coverUrl,
        gallery_previews: uploadedUrls,
      })
      nextStep()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro no upload'
      setError(`Falha no upload: ${message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Cover */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--gm-ink)]">
          Foto de capa <span className="text-red-400">*</span>
          <span className="ml-2 text-xs text-[var(--gm-ink-faint)]/80">Proporção 16:9 recomendada · máx. 2 MB</span>
        </label>
        <DropZone
          label="Arraste a imagem de capa aqui"
          accept="image/jpeg,image/png,image/webp"
          maxSize={MAX_COVER_BYTES}
          onFile={handleCoverFile}
          preview={coverPreview}
          onClear={() => { setCoverFile(null); setCoverPreview(null); updateDraft({ cover_preview: null }) }}
        />
      </div>

      {/* Gallery */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[var(--gm-ink)]">
            Imagens adicionais
            <span className="ml-2 text-xs text-[var(--gm-ink-faint)]/80">(máx. {MAX_GALLERY})</span>
          </label>
          <button
            type="button"
            disabled={galleryPreviews.length >= MAX_GALLERY}
            onClick={() => galleryInputRef.current?.click()}
            className="rounded-lg border border-dashed border-[var(--gm-ink-faint)]/30 px-3 py-1.5 text-xs text-[var(--gm-ink-faint)] transition-all hover:border-zinc-600 hover:text-[var(--gm-ink)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Adicionar ({galleryPreviews.length}/{MAX_GALLERY})
          </button>
        </div>
        <input
          ref={galleryInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => e.target.files && handleGalleryFiles(e.target.files)}
        />

        {galleryPreviews.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {galleryPreviews.map((src, idx) => (
              <div key={idx} className="group relative overflow-hidden rounded-xl border border-[var(--gm-ink-faint)]/20">
                <div className="relative aspect-square">
                  <Image src={src} alt={`Imagem ${idx + 1}`} fill className="object-cover" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-[var(--gm-paper)]/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <button type="button" onClick={() => idx > 0 && moveGallery(idx, idx - 1)} disabled={idx === 0}
                    className="rounded-full bg-zinc-800 p-1 text-xs disabled:opacity-30">◀</button>
                  <button type="button" onClick={() => removeGallery(idx)}
                    className="rounded-full bg-red-500/80 p-1 text-xs text-[var(--gm-ink)]">✕</button>
                  <button type="button" onClick={() => idx < galleryPreviews.length - 1 && moveGallery(idx, idx + 1)} disabled={idx === galleryPreviews.length - 1}
                    className="rounded-full bg-zinc-800 p-1 text-xs disabled:opacity-30">▶</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

      {/* Navigation */}
      <div className="flex justify-between">
        <button type="button" onClick={prevStep}
          className="rounded-xl border border-[var(--gm-ink-faint)]/30 px-5 py-3 text-sm font-medium text-[var(--gm-ink)] hover:border-zinc-600 hover:text-[var(--gm-ink)]">
          ← Voltar
        </button>
        <button type="button" onClick={handleNext} disabled={uploading}
          className="flex items-center gap-2 rounded-xl bg-[var(--gm-violet)] px-6 py-3 text-sm font-semibold text-[var(--gm-ink)] transition-all hover:bg-[var(--gm-violet)]/80 disabled:opacity-60">
          {uploading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Enviando…
            </>
          ) : 'Próximo →'}
        </button>
      </div>
    </div>
  )
}
