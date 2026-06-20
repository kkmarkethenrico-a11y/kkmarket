'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type TourStep = {
  id: string
  target?: string
  mobileTarget?: string
  title: string
  description: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

type TourLabels = {
  next: string
  back: string
  skip: string
  finish: string
  stepOf: (current: number, total: number) => string
}

interface PlatformTourProps {
  steps: TourStep[]
  labels: TourLabels
  onComplete: () => void
}

type Rect = { top: number; left: number; width: number; height: number }

const PADDING = 8
const TOOLTIP_GAP = 16

function getTargetRect(selector?: string): Rect | null {
  if (!selector) return null
  const el = document.querySelector(selector)
  if (!el) return null
  const box = el.getBoundingClientRect()
  return {
    top: box.top - PADDING,
    left: box.left - PADDING,
    width: box.width + PADDING * 2,
    height: box.height + PADDING * 2,
  }
}

function getTooltipStyle(
  rect: Rect | null,
  placement: TourStep['placement'],
): React.CSSProperties {
  if (!rect || placement === 'center') {
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      maxWidth: 'min(420px, calc(100vw - 32px))',
    }
  }

  const vw = window.innerWidth
  const vh = window.innerHeight
  const tooltipWidth = Math.min(380, vw - 32)
  const style: React.CSSProperties = {
    position: 'fixed',
    maxWidth: tooltipWidth,
    width: tooltipWidth,
  }

  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2

  switch (placement) {
    case 'bottom':
      style.top = Math.min(rect.top + rect.height + TOOLTIP_GAP, vh - 220)
      style.left = Math.max(16, Math.min(centerX - tooltipWidth / 2, vw - tooltipWidth - 16))
      break
    case 'top':
      style.top = Math.max(16, rect.top - TOOLTIP_GAP - 200)
      style.left = Math.max(16, Math.min(centerX - tooltipWidth / 2, vw - tooltipWidth - 16))
      break
    case 'left':
      style.top = Math.max(16, Math.min(centerY - 100, vh - 220))
      style.left = Math.max(16, rect.left - TOOLTIP_GAP - tooltipWidth)
      break
    case 'right':
    default:
      style.top = Math.max(16, Math.min(centerY - 100, vh - 220))
      style.left = Math.min(rect.left + rect.width + TOOLTIP_GAP, vw - tooltipWidth - 16)
      break
  }

  return style
}

export function PlatformTour({ steps, labels, onComplete }: PlatformTourProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [mounted, setMounted] = useState(false)

  const activeSteps = useMemo(
    () =>
      steps.filter((step) => {
        if (!step.target && !step.mobileTarget) return true
        const isMobile = window.innerWidth < 1024
        const selector = isMobile && step.mobileTarget ? step.mobileTarget : step.target
        return !selector || document.querySelector(selector)
      }),
    [steps],
  )

  const current = activeSteps[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === activeSteps.length - 1
  const placement = current?.placement ?? (current?.target ? 'bottom' : 'center')

  const updateRect = useCallback(() => {
    if (!current) return
    const isMobile = window.innerWidth < 1024
    const selector =
      isMobile && current.mobileTarget ? current.mobileTarget : current.target
    const nextRect = getTargetRect(selector)
    setRect(nextRect)
    if (selector) {
      document.querySelector(selector)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      })
    }
  }, [current])

  useEffect(() => setMounted(true), [])

  useLayoutEffect(() => {
    updateRect()
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)
    return () => {
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
    }
  }, [updateRect, stepIndex])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  if (!mounted || !current) return null

  const tooltipStyle = getTooltipStyle(rect, placement)

  const handleNext = () => {
    if (isLast) onComplete()
    else setStepIndex((i) => i + 1)
  }

  const handleBack = () => setStepIndex((i) => Math.max(0, i - 1))

  return createPortal(
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label={current.title}>
      {/* Overlay with spotlight cutout */}
      <svg className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden="true">
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(5, 8, 18, 0.82)"
          mask="url(#tour-spotlight-mask)"
          className="pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        />
      </svg>

      {/* Highlight ring */}
      {rect && (
        <div
          className="pointer-events-none fixed rounded-xl border-2 border-[var(--gm-cyan)] shadow-[0_0_24px_rgba(76,215,246,0.45)] transition-all duration-300"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        className={cn(
          'z-[201] rounded-2xl border border-white/10 bg-[var(--gm-paper)]/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl',
          'animate-in fade-in zoom-in-95 duration-300',
        )}
        style={tooltipStyle}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-ink-faint)]">
              {labels.stepOf(stepIndex + 1, activeSteps.length)}
            </span>
          </div>
          <button
            type="button"
            onClick={onComplete}
            className="rounded-lg p-1.5 text-[var(--gm-ink-faint)] transition-colors hover:bg-white/5 hover:text-[var(--gm-ink)]"
            aria-label={labels.skip}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 className="font-headline-sm text-lg font-bold text-white">{current.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--gm-ink-dim)]">{current.description}</p>

        {/* Progress dots */}
        <div className="mt-5 flex items-center gap-1.5">
          {activeSteps.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === stepIndex ? 'w-6 bg-primary' : 'w-1.5 bg-white/20',
              )}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onComplete}
            className="text-xs font-semibold text-[var(--gm-ink-faint)] transition-colors hover:text-[var(--gm-ink)]"
          >
            {labels.skip}
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button type="button" variant="outline" size="sm" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4" />
                {labels.back}
              </Button>
            )}
            <Button type="button" size="sm" onClick={handleNext} className="gap-1 font-bold">
              {isLast ? labels.finish : labels.next}
              {!isLast && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
