import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RollCall - Controle de Frequência',
  description: 'Sistema de controle de frequência escolar',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
