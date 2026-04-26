'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const onlyDigits = (v: string) => v.replace(/\D/g, '')

const profileSchema = z.object({
  display_name: z.string().trim().max(60).optional().or(z.literal('')),
  full_name:    z.string().trim().min(3, 'Nome muito curto').max(120).optional().or(z.literal('')),
  cpf:          z.string().trim().optional().or(z.literal('')).refine(
    (v) => !v || onlyDigits(v).length === 11,
    'CPF deve ter 11 dígitos'
  ),
  phone:        z.string().trim().max(20).optional().or(z.literal('')),
  birth_date:   z.string().trim().optional().or(z.literal('')).refine(
    (v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v),
    'Data inválida (YYYY-MM-DD)'
  ),
  bio:          z.string().trim().max(300).optional().or(z.literal('')),
  avatar_url:   z.string().url().optional().or(z.literal('')),
})

export type ProfileFormState = {
  ok?: boolean
  message?: string
  errors?: Partial<Record<keyof z.infer<typeof profileSchema>, string[]>>
} | null

export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Não autenticado' }

  const raw = {
    display_name: formData.get('display_name')?.toString() ?? '',
    full_name:    formData.get('full_name')?.toString() ?? '',
    cpf:          formData.get('cpf')?.toString() ?? '',
    phone:        formData.get('phone')?.toString() ?? '',
    birth_date:   formData.get('birth_date')?.toString() ?? '',
    bio:          formData.get('bio')?.toString() ?? '',
    avatar_url:   formData.get('avatar_url')?.toString() ?? '',
  }

  const parsed = profileSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      message: 'Verifique os campos.',
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  const v = parsed.data
  const update = {
    display_name: v.display_name || null,
    full_name:    v.full_name    || null,
    cpf:          v.cpf ? onlyDigits(v.cpf) : null,
    phone:        v.phone || null,
    birth_date:   v.birth_date || null,
    bio:          v.bio || null,
    avatar_url:   v.avatar_url || null,
    updated_at:   new Date().toISOString(),
  }

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') {
      return { message: 'Este CPF já está cadastrado em outra conta.' }
    }
    console.error('[updateProfile]', error.message)
    return { message: 'Erro ao salvar. Tente novamente.' }
  }

  revalidatePath('/configuracoes')
  return { ok: true, message: 'Dados atualizados com sucesso.' }
}
