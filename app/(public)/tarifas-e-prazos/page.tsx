import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tarifas e Prazos — KKmarket',
  description: 'Conheça nossas tarifas transparentes e os prazos de recebimento.',
}

export default function TarifasPrazosPage() {
  return (
    <main className="min-h-screen text-[var(--gm-ink)] py-16">
      <div className="container mx-auto max-w-3xl px-4">
        <h1 className="text-4xl font-black mb-6 text-center">Tarifas e <span className="text-[var(--gm-violet)]">Prazos</span></h1>
        
        <div className="rounded-2xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper)] p-8 shadow-sm mb-8">
          <h2 className="text-2xl font-bold mb-4">É grátis para anunciar?</h2>
          <p className="text-[var(--gm-ink-dim)] leading-relaxed mb-6">
            Sim! Você não paga absolutamente nada para criar sua conta ou publicar seus anúncios na KKmarket. Nós só ganhamos quando você ganha.
          </p>

          <h2 className="text-2xl font-bold mb-4">Taxas sobre Vendas</h2>
          <p className="text-[var(--gm-ink-dim)] leading-relaxed mb-4">
            Cobramos uma pequena comissão apenas sobre o valor das vendas concluídas com sucesso. O percentual varia de acordo com o plano do anúncio:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-[var(--gm-ink-dim)] mb-6">
            <li><strong className="text-[var(--gm-ink)]">Anúncio Comum:</strong> 12% + R$ 1,00 por transação.</li>
            <li><strong className="text-[var(--gm-amber)]">Anúncio Gold:</strong> 14% + R$ 1,00 por transação (Maior visibilidade).</li>
            <li><strong className="text-[var(--gm-violet)]">Anúncio Diamante:</strong> 16% + R$ 1,00 por transação (Visibilidade máxima na página inicial).</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4">Prazos de Saque</h2>
          <p className="text-[var(--gm-ink-dim)] leading-relaxed mb-4">
            A segurança da transação exige um prazo de proteção. Após a entrega do produto e liberação pelo comprador:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-[var(--gm-ink-dim)]">
            <li><strong className="text-[var(--gm-ink)]">Vendedores Novos:</strong> O saldo fica disponível para saque em 7 dias (D+7).</li>
            <li><strong className="text-[var(--gm-amber)]">Vendedores VIP:</strong> O saldo fica disponível em 2 dias úteis (D+2).</li>
            <li><strong className="text-[var(--gm-violet)]">Saques via PIX:</strong> Processamento em até 24 horas úteis após a solicitação.</li>
          </ul>
        </div>
      </div>
    </main>
  )
}