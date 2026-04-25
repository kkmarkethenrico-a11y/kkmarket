'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useWizardStore } from './wizard-store'
import { createClient } from '@/lib/supabase/client'

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

async function uploadToStorage(file: File, path: string): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from('announcements')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw new Error(error.message)
  const { data: pub } = supabase.storage.from('announcements').getPublicUrl(data.path)
  return pub.publicUrl
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
        <div className="relative overflow-hidden rounded-2xl border border-zinc-700">
          <div className="relative aspect-video w-full">
            <Image src={preview} alt="Preview" fill className="object-cover" />
          </div>
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-2 rounded-full bg-zinc-900/80 px-3 py-1 text-xs font-medium text-white backdrop-blur hover:bg-red-500/80"
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
            dragging ? 'border-violet-500 bg-violet-600/10' : 'border-zinc-700 bg-zinc-900/40 hover:border-zinc-600'
          }`}
        >
          <span className="text-3xl">🖼</span>
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-300">{label}</p>
            <p className="mt-1 text-xs text-zinc-500">
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
        const path = `covers/${Date.now()}-${coverFile.name}`
        coverUrl = await uploadToStorage(coverFile, path)
      }

      // Upload gallery files
      const existingUrls = galleryPreviews.filter((p) => p.startsWith('http'))
      const newPreviews = galleryPreviews.filter((p) => !p.startsWith('http'))
      const uploadedUrls = await Promise.all(
        galleryFiles.map(async (file, i) => {
          if (galleryPreviews[i]?.startsWith('http')) return galleryPreviews[i]
          const path = `gallery/${Date.now()}-${i}-${file.name}`
          return uploadToStorage(file, path)
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
        <label className="text-sm font-medium text-zinc-300">
          Foto de capa <span className="text-red-400">*</span>
          <span className="ml-2 text-xs text-zinc-500">Proporção 16:9 recomendada · máx. 2 MB</span>
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
          <label className="text-sm font-medium text-zinc-300">
            Imagens adicionais
            <span className="ml-2 text-xs text-zinc-500">(máx. {MAX_GALLERY})</span>
          </label>
          <button
            type="button"
            disabled={galleryPreviews.length >= MAX_GALLERY}
            onClick={() => galleryInputRef.current?.click()}
            className="rounded-lg border border-dashed border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
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
              <div key={idx} className="group relative overflow-hidden rounded-xl border border-zinc-800">
                <div className="relative aspect-square">
                  <Image src={src} alt={`Imagem ${idx + 1}`} fill className="object-cover" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-zinc-950/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <button type="button" onClick={() => idx > 0 && moveGallery(idx, idx - 1)} disabled={idx === 0}
                    className="rounded-full bg-zinc-800 p-1 text-xs disabled:opacity-30">◀</button>
                  <button type="button" onClick={() => removeGallery(idx)}
                    className="rounded-full bg-red-500/80 p-1 text-xs text-white">✕</button>
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
          className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-medium text-zinc-300 hover:border-zinc-600 hover:text-white">
          ← Voltar
        </button>
        <button type="button" onClick={handleNext} disabled={uploading}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-violet-500 disabled:opacity-60">
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
