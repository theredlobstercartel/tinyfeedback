import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TinyFeedback - Widget de Feedback Ultra-Leve',
  description: 'Widget de feedback ultra-leve para aplicações web',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  )
}
