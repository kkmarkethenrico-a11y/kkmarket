'use client'

import { useState } from 'react'
import Image from 'next/image'

interface GalleryImage {
  url: string
  is_cover: boolean
  sort_order: number
}

export function ImageGallery({ images }: { images: GalleryImage[] }) {
  const sorted = [...images].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1
    if (!a.is_cover && b.is_cover) return 1
    return a.sort_order - b.sort_order
  })

  const [active, setActive] = useState(0)
  const main = sorted[active]

  if (!main) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-zinc-800 text-5xl text-zinc-700">
        🎮
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900">
        <Image
          src={main.url}
          alt="Imagem principal do anúncio"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                i === active
                  ? 'border-violet-500 opacity-100'
                  : 'border-zinc-800 opacity-60 hover:border-zinc-600 hover:opacity-90'
              }`}
            >
              <Image
                src={img.url}
                alt={`Imagem ${i + 1}`}
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
