import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /auth/callback
 *
 * Responsável por duas tarefas:
 * 1. OAuth: troca o `code` recebido do provider (Google/Discord) por uma
 *    session de usuário via PKCE (exchangeCodeForSession).
 * 2. Recuperação de senha / confirmação de e-mail: o `next` param permite
 *    redirecionar para a rota correta após a troca.
 *
 * Redireciona para /painel em caso de sucesso, ou para /login?error=... em
 * caso de falha (sem expor detalhes internos ao client).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/painel'

  if (!code) {
    console.error('[auth/callback] code ausente na query string')
    return NextResponse.redirect(new URL('/login?error=missing_code', origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession falhou:', error.message)
    return NextResponse.redirect(new URL('/login?error=auth_failed', origin))
  }

  // Redireciona para /painel ou para a rota específica (ex: /nova-senha)
  // next só pode ser um path relativo — prevenção de open-redirect
  const safeNext = next.startsWith('/') ? next : '/painel'
  return NextResponse.redirect(new URL(safeNext, origin))
}