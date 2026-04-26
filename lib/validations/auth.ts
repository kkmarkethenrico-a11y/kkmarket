import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido.' }).trim(),
  password: z
    .string()
    .min(8, { message: 'Senha deve ter no mínimo 8 caracteres.' }),
})

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, { message: 'Username deve ter no mínimo 3 caracteres.' })
      .max(30, { message: 'Username deve ter no máximo 30 caracteres.' })
      .regex(/^[a-zA-Z0-9_]+$/, {
        message: 'Username pode conter apenas letras, números e underscore.',
      })
      .trim(),
    email: z.string().email({ message: 'E-mail inválido.' }).trim(),
    password: z
      .string()
      .min(8, { message: 'Senha deve ter no mínimo 8 caracteres.' })
      .regex(/[a-zA-Z]/, { message: 'Senha deve conter ao menos uma letra.' })
      .regex(/[0-9]/, { message: 'Senha deve conter ao menos um número.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })
