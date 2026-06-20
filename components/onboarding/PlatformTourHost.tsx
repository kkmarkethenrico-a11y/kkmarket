'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { completePlatformTourAction } from '@/app/actions/onboarding'
import { PlatformTour, type TourStep } from '@/components/onboarding/PlatformTour'

const STORAGE_KEY = 'kk_platform_tour_v1'

interface PlatformTourHostProps {
  dict: {
    onboarding: {
      steps: {
        welcome: { title: string; description: string }
        categories: { title: string; description: string }
        search: { title: string; description: string }
        missions: { title: string; description: string }
        cart: { title: string; description: string }
        account: { title: string; description: string }
        accountGuest: { title: string; description: string }
        language: { title: string; description: string }
        finish: { title: string; description: string }
      }
      next: string
      back: string
      skip: string
      finish: string
      stepOf: string
    }
  }
  serverShowTour: boolean
  isAuthenticated: boolean
}

export function PlatformTourHost({ dict, serverShowTour, isAuthenticated }: PlatformTourHostProps) {
  const pathname = usePathname()
  const [active, setActive] = useState(false)

  const steps = useMemo<TourStep[]>(() => {
    const s = dict.onboarding.steps
    return [
      {
        id: 'welcome',
        title: s.welcome.title,
        description: s.welcome.description,
        placement: 'center',
      },
      {
        id: 'categories',
        target: '[data-tour="categories"]',
        mobileTarget: '[data-tour="mobile-menu"]',
        title: s.categories.title,
        description: s.categories.description,
        placement: 'bottom',
      },
      {
        id: 'search',
        target: '[data-tour="search"]',
        mobileTarget: '[data-tour="mobile-search"]',
        title: s.search.title,
        description: s.search.description,
        placement: 'bottom',
      },
      {
        id: 'missions',
        target: '[data-tour="missions"]',
        title: s.missions.title,
        description: s.missions.description,
        placement: 'top',
      },
      {
        id: 'cart',
        target: '[data-tour="cart"]',
        title: s.cart.title,
        description: s.cart.description,
        placement: 'left',
      },
      {
        id: 'account',
        target: '[data-tour="account"]',
        mobileTarget: '[data-tour="mobile-menu"]',
        title: isAuthenticated ? s.account.title : s.accountGuest.title,
        description: isAuthenticated ? s.account.description : s.accountGuest.description,
        placement: 'left',
      },
      {
        id: 'language',
        target: '[data-tour="language"]',
        mobileTarget: '[data-tour="mobile-menu"]',
        title: s.language.title,
        description: s.language.description,
        placement: 'left',
      },
      {
        id: 'finish',
        title: s.finish.title,
        description: s.finish.description,
        placement: 'center',
      },
    ]
  }, [dict, isAuthenticated])

  const labels = useMemo(
    () => ({
      next: dict.onboarding.next,
      back: dict.onboarding.back,
      skip: dict.onboarding.skip,
      finish: dict.onboarding.finish,
      stepOf: (current: number, total: number) =>
        dict.onboarding.stepOf
          .replace('{current}', String(current))
          .replace('{total}', String(total)),
    }),
    [dict],
  )

  useEffect(() => {
    if (!serverShowTour) {
      localStorage.setItem(STORAGE_KEY, '1')
    }
  }, [serverShowTour])

  useEffect(() => {
    if (pathname !== '/') return

    const alreadyCompleted = localStorage.getItem(STORAGE_KEY) === '1'
    if (alreadyCompleted || !serverShowTour) return

    const timer = window.setTimeout(() => setActive(true), 900)
    return () => window.clearTimeout(timer)
  }, [pathname, serverShowTour])

  const handleComplete = useCallback(async () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setActive(false)
    if (isAuthenticated) {
      await completePlatformTourAction()
    }
  }, [isAuthenticated])

  if (!active) return null

  return <PlatformTour steps={steps} labels={labels} onComplete={handleComplete} />
}
