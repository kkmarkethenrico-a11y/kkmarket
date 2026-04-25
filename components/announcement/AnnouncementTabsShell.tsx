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
}

export function AnnouncementTabsShell({
  description,
  sellerId,
  announcementId,
  isAuthenticated,
  currentUserId,
  initialReviews,
  initialComments,
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
        <div
          className="prose prose-invert prose-sm max-w-none text-zinc-300 [&_h2]:text-zinc-100 [&_h3]:text-zinc-200 [&_strong]:text-zinc-200 [&_a]:text-violet-400 [&_a:hover]:text-violet-300 [&_ul]:text-zinc-400 [&_ol]:text-zinc-400 leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      </TabsContent>

      {/* Reviews */}
      <TabsContent value="reviews" className="mt-6">
        <ReviewsTab initial={initialReviews} sellerId={sellerId} />
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
