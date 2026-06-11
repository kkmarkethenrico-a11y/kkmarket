import type { Metadata } from 'next'
import { QrCode, CreditCard, FileText, Wallet } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Formas de Pagamento — KKmarket',
  description: 'Saiba quais métodos de pagamento são aceitos na plataforma KKmarket.',
}

export default function FormasPagamentoPage() {
  return (
    <main className="min-h-screen text-[var(--gm-ink)] py-16">
      <div className="container mx-auto max-w-3xl px-4">
        <h1 className="text-4xl font-black mb-6 text-center">Formas de <span className="text-[var(--gm-cyan)]">Pagamento</span></h1>
        
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Pix */}
          <div className="rounded-2xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper)] p-6 shadow-sm flex flex-col items-center text-center hover:border-[var(--gm-cyan)]/50 transition-colors">
            <QrCode className="h-10 w-10 mb-4 text-[var(--gm-cyan)]" strokeWidth={1.5} />
            <h2 className="text-xl font-bold mb-2">PIX</h2>
            <p className="text-sm text-[var(--gm-ink-dim)]">Aprovação imediata. A forma mais rápida e barata de garantir suas compras.</p>
          </div>

          {/* Cartão de Crédito */}
          <div className="rounded-2xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper)] p-6 shadow-sm flex flex-col items-center text-center hover:border-[var(--gm-cyan)]/50 transition-colors">
            <CreditCard className="h-10 w-10 mb-4 text-[var(--gm-cyan)]" strokeWidth={1.5} />
            <h2 className="text-xl font-bold mb-2">Cartão de Crédito</h2>
            <p className="text-sm text-[var(--gm-ink-dim)]">Aprovação instantânea. Parcelem em até 12x (com juros da operadora).</p>
          </div>

          {/* Boleto Bancário */}
          <div className="rounded-2xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper)] p-6 shadow-sm flex flex-col items-center text-center hover:border-[var(--gm-cyan)]/50 transition-colors">
            <FileText className="h-10 w-10 mb-4 text-[var(--gm-cyan)]" strokeWidth={1.5} />
            <h2 className="text-xl font-bold mb-2">Boleto Bancário</h2>
            <p className="text-sm text-[var(--gm-ink-dim)]">Aprovação em até 2 dias úteis. Ideal para pagamentos à vista offline.</p>
          </div>

          {/* Saldo na Carteira */}
          <div className="rounded-2xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper)] p-6 shadow-sm flex flex-col items-center text-center hover:border-[var(--gm-violet)]/50 transition-colors">
            <Wallet className="h-10 w-10 mb-4 text-[var(--gm-violet)]" strokeWidth={1.5} />
            <h2 className="text-xl font-bold mb-2">Saldo em Carteira</h2>
            <p className="text-sm text-[var(--gm-ink-dim)]">Utilize o saldo de suas próprias vendas para realizar compras instantâneas.</p>
          </div>
        </div>
      </div>
    </main>
  )
}