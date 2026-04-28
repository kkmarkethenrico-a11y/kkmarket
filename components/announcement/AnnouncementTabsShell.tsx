'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ReviewsTab, QuestionsTab } from './AnnouncementTabs'

interface AnnouncementTabsShellProps {
  description: string
  sellerId: string
  announcementId: string
  isAuthenticated: boolean
  currentUserId: string | null
  initialReviews: Parameters<typeof ReviewsTab>[0]['initial']
  initialComments: Parameters<typeof QuestionsTab>[0]['initial']
  reviewsPositive?: number
  reviewsNeutral?: number
  reviewsNegative?: number
}

export function AnnouncementTabsShell({
  description,
  sellerId,
  announcementId,
  isAuthenticated,
  currentUserId,
  initialReviews,
  initialComments,
  reviewsPositive = 0,
  reviewsNeutral = 0,
  reviewsNegative = 0,
}: AnnouncementTabsShellProps) {
  return (
    <Tabs defaultValue="description" className="w-full">
      <TabsList
        variant="line"
        className="w-full justify-start border-b border-zinc-800 rounded-none bg-transparent h-auto pb-0 gap-0"
      >
        <TabsTrigger value="description" className="px-5 py-3 text-sm font-medium">
          📝 Descrição
        </TabsTrigger>
        <TabsTrigger value="reviews" className="px-5 py-3 text-sm font-medium">
          ⭐ Avaliações
        </TabsTrigger>
        <TabsTrigger value="questions" className="px-5 py-3 text-sm font-medium">
          💬 Perguntas
        </TabsTrigger>
      </TabsList>

      {/* Description */}
      <TabsContent value="description" className="mt-6">
        <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
          {description}
        </div>
      </TabsContent>

      {/* Reviews */}
      <TabsContent value="reviews" className="mt-6">
        <ReviewsTab
          initial={initialReviews}
          sellerId={sellerId}
          reviewsPositive={reviewsPositive}
          reviewsNeutral={reviewsNeutral}
          reviewsNegative={reviewsNegative}
        />
      </TabsContent>

      {/* Questions */}
      <TabsContent value="questions" className="mt-6">
        <QuestionsTab
          initial={initialComments}
          announcementId={announcementId}
          sellerId={sellerId}
          isAuthenticated={isAuthenticated}
          currentUserId={currentUserId}
        />
      </TabsContent>
    </Tabs>
  )
}
