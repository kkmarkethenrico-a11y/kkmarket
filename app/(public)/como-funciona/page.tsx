import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Como Funciona — KKmarket',
  description: 'Entenda como funciona a plataforma KKmarket para compradores e vendedores.',
}

export default function ComoFuncionaPage() {
  return (
    <main className="min-h-screen text-[var(--gm-ink)] py-16">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black mb-4">Como Funciona a <span className="text-[var(--gm-violet)]">KKmarket</span>?</h1>
          <p className="text-lg text-[var(--gm-ink-dim)]">
            A sua segurança é a nossa prioridade. Entenda o nosso modelo de intermediação.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Para Compradores */}
          <div className="rounded-2xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper)] p-8 shadow-sm">
            <h2 className="text-2xl font-black mb-6 text-[var(--gm-violet)]">Para Compradores</h2>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gm-violet)]/10 text-[var(--gm-violet)] font-bold">1</span>
                <div>
                  <h3 className="font-bold mb-1">Encontre o que deseja</h3>
                  <p className="text-sm text-[var(--gm-ink-dim)]">Navegue pelas nossas diversas categorias, busque por itens, contas ou jogos desejados usando nossos filtros avançados.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gm-violet)]/10 text-[var(--gm-violet)] font-bold">2</span>
                <div>
                  <h3 className="font-bold mb-1">Pague com Segurança</h3>
                  <p className="text-sm text-[var(--gm-ink-dim)]">Ao realizar o pagamento, seu dinheiro não vai direto para o vendedor. Ele fica retido em nosso sistema de garantia (Escrow).</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gm-violet)]/10 text-[var(--gm-violet)] font-bold">3</span>
                <div>
                  <h3 className="font-bold mb-1">Receba e Avalie</h3>
                  <p className="text-sm text-[var(--gm-ink-dim)]">O vendedor entrega o produto. Você confere se está tudo certo e libera o pagamento, deixando sua avaliação!</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Para Vendedores */}
          <div className="rounded-2xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper)] p-8 shadow-sm">
            <h2 className="text-2xl font-black mb-6 text-[var(--gm-cyan)]">Para Vendedores</h2>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gm-cyan)]/10 text-[var(--gm-cyan)] font-bold">1</span>
                <div>
                  <h3 className="font-bold mb-1">Crie seus Anúncios</h3>
                  <p className="text-sm text-[var(--gm-ink-dim)]">Publique seus produtos gratuitamente. Preencha todos os detalhes, adicione imagens e atraia milhares de compradores.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gm-cyan)]/10 text-[var(--gm-cyan)] font-bold">2</span>
                <div>
                  <h3 className="font-bold mb-1">Entregue o Produto</h3>
                  <p className="text-sm text-[var(--gm-ink-dim)]">Quando uma venda for confirmada, você será notificado. Utilize o chat interno para passar os dados ou a entrega automática.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gm-cyan)]/10 text-[var(--gm-cyan)] font-bold">3</span>
                <div>
                  <h3 className="font-bold mb-1">Receba seu Dinheiro</h3>
                  <p className="text-sm text-[var(--gm-ink-dim)]">Após a liberação do comprador, o saldo vai direto para a sua carteira digital, pronto para ser sacado quando desejar.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/cadastro" className="inline-block rounded-xl bg-[var(--gm-violet)] px-8 py-4 font-black text-[#1a1126] transition-all hover:scale-105 hover:opacity-90 gm-glow">
            Começar Agora
          </Link>
        </div>
      </div>
    </main>
  )
}