import { FileText } from 'lucide-react'

export const metadata = {
  title: 'Termos de Uso — KKmarket',
  description: 'Leia nossos Termos de Uso e entenda as regras para compradores e vendedores na plataforma.',
}

export default function TermosPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 min-h-screen">
      <div className="mb-12 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--gm-violet)]/10">
          <FileText className="h-8 w-8 text-[var(--gm-violet)]" />
        </div>
        <h1 className="text-3xl font-bold text-[var(--gm-ink)] sm:text-4xl">Termos de Uso</h1>
        <p className="mt-4 text-[var(--gm-ink-faint)]">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>

      <div className="prose prose-invert max-w-none text-[var(--gm-ink-dim)]">
        <section className="mb-8 rounded-2xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-2)] p-6 md:p-8">
          <h2 className="mb-4 text-xl font-bold text-[var(--gm-ink)]">1. Introdução</h2>
          <p className="mb-4">
            Bem-vindo à <strong>KKmarket</strong>. Estes Termos de Uso regulamentam o acesso e a utilização da nossa plataforma de marketplace, que conecta compradores a vendedores de produtos digitais. Ao acessar ou criar uma conta na KKmarket, você concorda expressamente com todos os termos descritos neste documento.
          </p>

          <h2 className="mb-4 text-xl font-bold text-[var(--gm-ink)]">2. Do Papel da KKmarket</h2>
          <p className="mb-4">
            A KKmarket atua exclusivamente como uma intermediadora de negócios (marketplace). Fornecemos o espaço virtual e as ferramentas de transação e garantia (Escrow) para que compradores e vendedores negociem entre si. Não somos proprietários dos produtos digitais anunciados e não temos posse sobre eles.
          </p>

          <h2 className="mb-4 text-xl font-bold text-[var(--gm-ink)]">3. Da Responsabilidade do Vendedor</h2>
          <p className="mb-4">
            É de inteira responsabilidade do <strong>Vendedor</strong> garantir que os produtos digitais oferecidos (contas, chaves, scripts, serviços) sejam legítimos, funcionais e que não infrinjam direitos autorais ou termos de serviço de plataformas de terceiros. A KKmarket se reserva ao direito de suspender anúncios e contas que descumpram estas regras.
          </p>

          <h2 className="mb-4 text-xl font-bold text-[var(--gm-ink)]">4. Sistema de Garantia (Escrow)</h2>
          <p className="mb-4">
            Para garantir a segurança das transações, a KKmarket retém o pagamento do comprador e só libera o saldo para a carteira do vendedor quando o produto é entregue e o recebimento é confirmado (ou após o término do prazo de qualificação e segurança). Em caso de disputas, a equipe de moderação avaliará as conversas do chat interno e provas enviadas para deliberar o reembolso ou a liberação.
          </p>

          <h2 className="mb-4 text-xl font-bold text-[var(--gm-ink)]">5. Itens Proibidos</h2>
          <p className="mb-4">
            É terminantemente proibida a venda de malwares, serviços que promovam discursos de ódio, dados pessoais de terceiros (phishing/vazamentos) ou qualquer conteúdo digital que viole as leis vigentes da República Federativa do Brasil.
          </p>
        </section>
      </div>
    </div>
  )
}
