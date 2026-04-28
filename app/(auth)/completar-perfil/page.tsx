import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompleteProfileForm } from './CompleteProfileForm'

/**
 * /completar-perfil
 *
 * Página de onboarding para novos usuários OAuth (Google/Discord).
 * Redireciona para /painel se:
 *   - Usuário não está autenticado → /login
 *   - onboarding_complete já é true → /painel (já completou)
 */
export default async function CompleteProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url, onboarding_complete')
    .eq('id', user.id)
    .single()

  // Já completou o onboarding → não deveria estar aqui
  if (!profile || profile.onboarding_complete) redirect('/painel')

  return (
    <CompleteProfileForm
      suggestedUsername={profile.username}
      displayName={profile.display_name}
      avatarUrl={profile.avatar_url}
    />
  )
}
