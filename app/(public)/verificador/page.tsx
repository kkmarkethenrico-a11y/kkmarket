import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import VerifierClient from './VerifierClient'

export const metadata: Metadata = {
  title:       'Verificador de Contas — Cheque antifraude grátis | KKMarket',
  description: 'Antes de comprar uma conta de jogo, verifique se ela está marcada como fraudulenta no nosso banco antifraude público. Proteja-se contra recuperações fraudulentas e golpes.',
  keywords:    [
    'verificador de contas',
    'antifraude jogos',
    'recuperação fraudulenta',
    'conta hackeada',
    'golpe conta de jogo',
    'comprar conta segura',
    'KKMarket',
  ],
  openGraph: {
    title:       'Verificador de Contas — Antifraude grátis',
    description: 'Cheque qualquer email/usuário/CPF contra nosso banco público de contas problemáticas em jogos.',
    type:        'website',
  },
  robots: { index: true, follow: true },
}

const FAQ = [
  {
    q: 'Como funciona o Verificador de Contas?',
    a: 'É um banco de dados público alimentado por denúncias da comunidade e moderado pela equipe da KKMarket. Você informa o email, usuário ou CPF da conta de jogo que pretende comprar — se houver registro de fraude ou suspeita, mostramos um alerta antes da compra.',
  },
  {
    q: 'O que é "recuperação fraudulenta"?',
    a: 'Acontece quando o vendedor original da conta usa o sistema de recuperação de senha do jogo (email, SMS ou suporte) para retomar o controle da conta após a venda — deixando o comprador sem acesso. É a fraude mais comum em marketplaces de contas.',
  },
  {
    q: 'A consulta é anônima?',
    a: 'Sim. Você pode consultar qualquer identificador sem login. As denúncias podem ser anônimas (com email opcional para contato) ou identificadas (recomendado para maior credibilidade).',
  },
  {
    q: 'Identificador limpo significa conta 100% segura?',
    a: 'Não — significa apenas que ela não está em nossa base. Sempre prefira vendedores com plano Gold/Diamond, alta reputação e use o escrow da KKMarket, que protege seu pagamento por dias após a entrega.',
  },
  {
    q: 'Como reportar uma conta fraudulenta?',
    a: 'Use o botão "Denunciar conta" nesta página. Forneça evidências (prints da fraude, comprovantes de compra) e a moderação validará o caso antes de tornar o registro público.',
  },
]

export default async function VerificadorPage() {
  const supabase = await createClient()

  // Pre-load games (root categories) for the report form
  const { data: games } = await supabase
    .from('categories')
    .select('id, name, slug')
    .is('parent_id', null)
    .eq('status', true)
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto max-w-4xl px-4 py-12">

        <header className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/10 ring-1 ring-violet-500/30">
            <span className="text-3xl">🛡️</span>
          </div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Verificador de Contas
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-400 sm:text-base">
            Antes de comprar uma conta de jogo, cheque grátis contra nosso banco
            antifraude público. Identificadores marcados aqui têm histórico de
            <span className="font-semibold text-red-300"> recuperação fraudulenta </span>
            ou <span className="font-semibold text-amber-300">comportamento suspeito</span>.
          </p>
        </header>

        <VerifierClient games={games ?? []} />

        <section className="mt-16 space-y-8">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
            <h2 className="mb-3 text-xl font-bold text-white">Por que verificar antes de comprar?</h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              O golpe mais comum em marketplaces de contas é a <strong>recuperação fraudulenta</strong>:
              o vendedor entrega o login, recebe o pagamento e, alguns dias depois, usa o sistema
              de recuperação de senha para retomar a conta. O comprador fica sem o produto e sem
              o dinheiro. Nosso verificador é uma camada extra de proteção — alimentada por
              denúncias da comunidade e validada pela equipe de moderação.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
            <h2 className="mb-4 text-xl font-bold text-white">Perguntas frequentes</h2>
            <dl className="space-y-4">
              {FAQ.map((item) => (
                <div key={item.q} className="border-b border-zinc-800/60 pb-4 last:border-b-0 last:pb-0">
                  <dt className="font-semibold text-zinc-100">{item.q}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-zinc-400">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

      </div>
    </div>
  )
}
