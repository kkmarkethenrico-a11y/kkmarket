import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Programa de Pontos — KKmarket',
  description: 'Conheça o sistema KKs Points e veja como trocar XP por dinheiro.',
}

export default function ProgramaPontosPage() {
  return (
    <main className="min-h-screen text-[var(--gm-ink)] py-16">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black mb-4">Programa <span className="text-[var(--gm-violet)]">KKs Points</span></h1>
          <p className="text-lg text-[var(--gm-ink-dim)]">
            A cada compra, venda e login diário você acumula XP e troca por benefícios!
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper)] p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-6">Como Ganhar XP?</h2>
          
          <div className="grid gap-6 md:grid-cols-3 mb-10">
            <div className="p-5 rounded-xl bg-[var(--gm-paper-2)] border border-[var(--gm-ink-faint)]/10 text-center">
              <span className="text-3xl mb-3 block">⚡</span>
              <h3 className="font-bold mb-2">Comprando</h3>
              <p className="text-xs text-[var(--gm-ink-dim)]">Ganhe pontos e XP por cada R$ gasto em nosso site de forma automática.</p>
            </div>
            <div className="p-5 rounded-xl bg-[var(--gm-paper-2)] border border-[var(--gm-ink-faint)]/10 text-center">
              <span className="text-3xl mb-3 block">📦</span>
              <h3 className="font-bold mb-2">Vendendo</h3>
              <p className="text-xs text-[var(--gm-ink-dim)]">Complete uma venda e receba recompensas de XP para subir o Nível da sua conta.</p>
            </div>
            <div className="p-5 rounded-xl bg-[var(--gm-paper-2)] border border-[var(--gm-ink-faint)]/10 text-center">
              <span className="text-3xl mb-3 block">🎁</span>
              <h3 className="font-bold mb-2">Missões Diárias</h3>
              <p className="text-xs text-[var(--gm-ink-dim)]">Acesse o painel e resgate seus KKs Points diários através de missões de login.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-4">Troque por Saldo Real</h2>
          <p className="text-[var(--gm-ink-dim)] leading-relaxed mb-6">
            Não é só um número! Todo XP acumulado pode ser convertido em <strong>KKs Points</strong>. Ao atingir o limite mínimo, você pode ir no seu Painel de Controle e realizar a conversão diretamente para o saldo da sua carteira. Aquele saldo vira R$ e pode ser sacado para o seu PIX.
          </p>

          <h2 className="text-2xl font-bold mb-4">Sistema de Níveis</h2>
          <p className="text-[var(--gm-ink-dim)] leading-relaxed mb-8">
            Além dos pontos, as suas ações elevam o seu <strong>LVL (Nível de Jogador)</strong>. Vendedores de níveis mais altos passam mais credibilidade, ganham emblemas especiais (Badges) nos anúncios e possuem prazos de saque reduzidos.
          </p>

          <div className="text-center">
            <Link href="/painel" className="inline-block rounded-xl border border-[var(--gm-violet)] bg-[var(--gm-violet)]/10 px-8 py-4 font-black text-[var(--gm-violet)] transition-all hover:bg-[var(--gm-violet)] hover:text-[#1a1126]">
              Acessar Meu Painel e XP
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}