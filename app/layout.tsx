import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Quimbel Admin',
  description: 'Internal operations console',
  robots: 'noindex, nofollow',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
