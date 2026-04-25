import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata = {
  title: 'Criar conta — GameMarket',
  description: 'Crie sua conta GameMarket grátis e comece a comprar e vender produtos digitais de games.',
}

export default async function CadastroPage() {
  // Redireciona usuário já autenticado para o painel
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/painel')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-16">
      {/* Background decorativo */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <RegisterForm />
    </div>
  )
}