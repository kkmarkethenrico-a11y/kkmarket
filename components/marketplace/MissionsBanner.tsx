'use client'

import { useState } from 'react'
import { Medal } from 'lucide-react'
import { toast } from 'sonner'
import { redeemMissionsRewardAction } from '@/app/actions/missions'

interface MissionsBannerProps {
  userPoints: number
  userId: string | null
  dict: any
}

export function MissionsBanner({ userPoints, userId, dict }: MissionsBannerProps) {
  const [loading, setLoading] = useState(false)

  const handleClaim = async () => {
    if (!userId) {
      toast.error('Você precisa entrar na sua conta para resgatar recompensas.')
      return
    }

    if (userPoints < 1500) {
      toast.error('Você não possui o saldo mínimo de 1.500 KK-COINS.')
      return
    }

    setLoading(true)
    try {
      const res = await redeemMissionsRewardAction()
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error('Erro ao processar o resgate. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate the next threshold goal (1500, 3000, 4500, etc.)
  const nextGoal = Math.max(1500, Math.ceil((userPoints + 1) / 1500) * 1500)
  // Calculate percentage of progress towards the next goal
  const progressPercent = userId ? ((userPoints % 1500) / 1500) * 100 : 75

  return (
    <section className="mt-8" data-tour="missions">
      <div className="bg-secondary-container text-on-secondary-container p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between shadow-lg gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-on-secondary-container text-secondary p-3 rounded-lg">
            <Medal className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm leading-tight">{dict.missions.title}</h3>
            <p className="font-label-md text-label-md opacity-80">{dict.missions.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <div className="font-label-sm text-label-sm uppercase tracking-widest opacity-60">{dict.missions.nextReward}</div>
            <div className="font-label-md text-label-md font-bold">
              {userId ? `${userPoints.toLocaleString('pt-BR')} / ${nextGoal.toLocaleString('pt-BR')} KK-COINS` : '1.500 KK-COINS'}
            </div>
          </div>
          <div className="hidden sm:block w-32 h-2 bg-on-secondary-container/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-on-secondary-container transition-all duration-500" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
          <button 
            onClick={handleClaim}
            disabled={loading}
            className="bg-on-secondary-container text-secondary-container px-6 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
          >
            {loading ? 'Resgatando...' : dict.missions.claim}
          </button>
        </div>
      </div>
    </section>
  )
}
