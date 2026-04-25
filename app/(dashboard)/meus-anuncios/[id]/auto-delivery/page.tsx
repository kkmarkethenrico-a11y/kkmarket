import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AutoDeliveryManager from './AutoDeliveryManager'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AutoDeliveryPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: announcement } = await supabase
    .from('announcements')
    .select('id, title, user_id, has_auto_delivery, status')
    .eq('id', id)
    .single()

  if (!announcement) notFound()
  if (announcement.user_id !== user.id) redirect('/meus-anuncios')

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Entrega Automática</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Anúncio: <span className="font-medium">{announcement.title}</span>
        </p>
      </div>

      <div className="mb-6 rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 p-4 text-sm">
        <p className="font-semibold mb-1">🔒 Segurança</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Credenciais são criptografadas (AES-256) antes de serem salvas.</li>
          <li>Após salvar, nem mesmo você pode visualizar o conteúdo.</li>
          <li>O comprador só recebe a credencial após o pagamento ser confirmado.</li>
          <li>Itens já entregues não podem ser removidos.</li>
        </ul>
      </div>

      <AutoDeliveryManager announcementId={id} />
    </div>
  )
}
