import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Obter o usuário atualizado da sessão
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Verificar se completou o onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', user.id)
          .maybeSingle()

        if (profile && !profile.onboarding_complete) {
          // Se for login OAuth novo com onboarding incompleto, envia para /completar-perfil
          return NextResponse.redirect(`${origin}/completar-perfil`)
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Em caso de erro, redireciona de volta para o login com parâmetro de erro
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}
