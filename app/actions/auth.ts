'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { loginSchema, registerSchema } from '@/lib/validations/auth'

export type LoginFormState = {
  errors?: { email?: string[]; password?: string[] }
  message?: string
} | null

export type RegisterFormState = {
  errors?: {
    username?: string[]
    email?: string[]
    password?: string[]
    confirmPassword?: string[]
  }
  message?: string
} | null

// ─── Server Actions ─────────────────────────────────────────────────────────

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { message: 'E-mail ou senha incorretos.' }
  }

  redirect('/painel')
}

export async function registerAction(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const parsed = registerSchema.safeParse({
    username: formData.get('username'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  // Verificar disponibilidade do username
  const { data: existing } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', parsed.data.username.toLowerCase())
    .maybeSingle()

  if (existing) {
    return { errors: { username: ['Este username já está em uso.'] } }
  }

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { username: parsed.data.username.toLowerCase() },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/callback`,
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { errors: { email: ['Este e-mail já está cadastrado.'] } }
    }
    return { message: 'Erro ao criar conta. Tente novamente.' }
  }

  return {
    message:
      'success:Conta criada! Verifique seu e-mail para ativar sua conta.',
  }
}

export async function forgotPasswordAction(
  _prevState: { message?: string } | null,
  formData: FormData,
): Promise<{ message?: string } | null> {
  const email = formData.get('email')?.toString().trim()

  if (!email || !z.string().email().safeParse(email).success) {
    return { message: 'error:Informe um e-mail válido.' }
  }

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/callback?next=/nova-senha`,
  })

  // Sempre retorna sucesso para não revelar se o e-mail existe
  return { message: 'success:Se este e-mail estiver cadastrado, você receberá as instruções em breve.' }
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function signInWithOAuthAction(provider: 'google' | 'discord') {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/callback`,
      // Solicita escopo de e-mail e perfil ao Google
      scopes: provider === 'google' ? 'openid email profile' : undefined,
    },
  })

  if (error || !data.url) {
    return { error: 'Erro ao iniciar login social.' }
  }

  redirect(data.url)
}

// ─── Completa perfil de usuário OAuth (username definitivo) ──────────────────

export type CompleteProfileState = { error?: string } | null

export async function completeProfileAction(
  _prevState: CompleteProfileState,
  formData: FormData,
): Promise<CompleteProfileState> {
  const username = formData.get('username')?.toString().trim().toLowerCase() ?? ''

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return { error: 'Username deve ter 3–30 caracteres (letras, números e _).' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('profiles')
    .update({ username, onboarding_complete: true, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') {
      return { error: 'Este username já está em uso. Escolha outro.' }
    }
    return { error: 'Erro ao salvar. Tente novamente.' }
  }

  redirect('/painel')
}
