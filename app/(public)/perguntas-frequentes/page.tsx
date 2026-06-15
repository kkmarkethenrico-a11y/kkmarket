import { HelpCircle } from 'lucide-react'

export const metadata = {
  title: 'Perguntas Frequentes — KKmarket',
  description: 'Dúvidas sobre compras, vendas, entregas e taxas na plataforma.',
}

export default function FAQPage() {
  const faqs = [
    {
      q: 'Como funciona a Entrega Automática?',
      a: 'Produtos marcados com "Entrega Automática" são entregues instantaneamente assim que o pagamento via Pix ou Cartão é aprovado. O sistema puxa a chave diretamente do cofre blindado do vendedor e exibe no seu chat do pedido.',
    },
    {
      q: 'Quais são as taxas para vender?',
      a: 'A taxa varia de acordo com o plano do anúncio escolhido (Prata, Ouro ou Diamante). O plano Prata possui a menor taxa, enquanto o Diamante oferece máxima exposição na página inicial e e-mails por uma comissão ligeiramente maior.',
    },
    {
      q: 'Como o pagamento é protegido?',
      a: 'Nós utilizamos o sistema de "Escrow" (Garantia KKmarket). O seu dinheiro fica retido de forma segura conosco até que o vendedor entregue o produto corretamente e você valide o recebimento.',
    },
    {
      q: 'Posso sacar o dinheiro das minhas vendas?',
      a: 'Sim! Assim que o comprador confirmar o recebimento ou o prazo de segurança expirar, o saldo é liberado para a sua carteira e você pode solicitar um saque direto para a sua chave Pix.',
    },
    {
      q: 'O que são KKs Points?',
      a: 'Os KKs Points são a nossa moeda de gamificação. Você ganha pontos ao comprar, vender e avaliar produtos. Eles podem ser trocados por saldo real na sua carteira, para usar como desconto em compras futuras!',
    },
    {
      q: 'Como serei notificado sobre minhas vendas?',
      a: 'Nós enviamos notificações pelo próprio painel do sistema e também notificações push/chat quando um pagamento é aprovado, uma entrega ocorre ou você recebe uma nova mensagem do cliente.',
    }
  ]

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 min-h-screen">
      <div className="mb-12 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--gm-violet)]/10">
          <HelpCircle className="h-8 w-8 text-[var(--gm-violet)]" />
        </div>
        <h1 className="text-3xl font-bold text-[var(--gm-ink)] sm:text-4xl">Perguntas Frequentes</h1>
        <p className="mt-4 text-[var(--gm-ink-faint)]">
          Encontre respostas rápidas para as principais dúvidas sobre a plataforma.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {faqs.map((faq, i) => (
          <div key={i} className="rounded-2xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-2)] p-6 transition-all hover:border-[var(--gm-violet)]/30">
            <h3 className="mb-2 text-lg font-bold text-[var(--gm-ink)]">{faq.q}</h3>
            <p className="text-sm leading-relaxed text-[var(--gm-ink-dim)]">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}