import { ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidade — KKmarket',
  description: 'Saiba como coletamos, usamos e protegemos os seus dados na plataforma.',
}

export default function PrivacidadePage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 min-h-screen">
      <div className="mb-12 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--gm-cyan)]/10">
          <ShieldCheck className="h-8 w-8 text-[var(--gm-cyan)]" />
        </div>
        <h1 className="text-3xl font-bold text-[var(--gm-ink)] sm:text-4xl">Política de Privacidade</h1>
        <p className="mt-4 text-[var(--gm-ink-faint)]">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>

      <div className="prose prose-invert max-w-none text-[var(--gm-ink-dim)]">
        <section className="mb-8 rounded-2xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-2)] p-6 md:p-8">
          <h2 className="mb-4 text-xl font-bold text-[var(--gm-ink)]">1. Coleta de Dados</h2>
          <p className="mb-4">
            A KKmarket coleta informações necessárias para garantir a segurança das transações e proporcionar uma experiência personalizada. Isso inclui seu endereço de e-mail, nome de usuário, documentos de verificação (quando houver solicitação para nível de vendedor) e registros de transações no marketplace.
          </p>

          <h2 className="mb-4 text-xl font-bold text-[var(--gm-ink)]">2. Uso das Informações</h2>
          <p className="mb-4">
            Utilizamos seus dados exclusivamente para:
          </p>
          <ul className="mb-4 list-disc pl-5 space-y-2">
            <li>Processar seus pagamentos e intermediar a garantia de entrega (Escrow).</li>
            <li>Melhorar os algoritmos de recomendação do marketplace.</li>
            <li>Garantir a segurança da comunidade, investigando e bloqueando atividades fraudulentas.</li>
            <li>Cumprir obrigações legais em território nacional.</li>
          </ul>

          <h2 className="mb-4 text-xl font-bold text-[var(--gm-ink)]">3. Processamento de Pagamentos (Mercado Pago)</h2>
          <p className="mb-4">
            Não armazenamos dados de cartão de crédito. Todo o processamento de Pix e Cartões é feito em ambiente criptografado e repassado diretamente à nossa infraestrutura de pagamentos integrada ao <strong>Mercado Pago</strong>.
          </p>

          <h2 className="mb-4 text-xl font-bold text-[var(--gm-ink)]">4. Uso de Cookies e Sessões</h2>
          <p className="mb-4">
            Empregamos cookies e tokens de sessão para manter você autenticado em nosso sistema, além de salvar preferências (como o tema Claro/Escuro). Ao utilizar a KKmarket, você autoriza o armazenamento dessas pequenas chaves temporárias em seu navegador.
          </p>

          <h2 className="mb-4 text-xl font-bold text-[var(--gm-ink)]">5. Seus Direitos</h2>
          <p className="mb-4">
            Conforme a Lei Geral de Proteção de Dados (LGPD), você pode solicitar a exclusão de sua conta e anonimização de suas compras entrando em contato através do nosso canal oficial de suporte presente na plataforma.
          </p>
        </section>
      </div>
    </div>
  )
}
