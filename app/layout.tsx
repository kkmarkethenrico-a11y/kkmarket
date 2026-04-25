import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: {
    default: 'GameMarket — Compre e Venda Produtos Digitais de Games',
    template: '%s | GameMarket',
  },
  description:
    'Marketplace confiável para compra e venda de contas, itens, gold e serviços de jogos digitais. Entrega garantida e pagamento seguro.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kkmarket.com.br'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
