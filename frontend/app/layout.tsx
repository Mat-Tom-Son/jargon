import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Jargon AI - Translation Layer Admin',
  description: 'Enterprise-grade semantic debt management platform for managing business terminology and data translation across heterogeneous systems.',
  keywords: ['semantic debt', 'business terminology', 'data governance', 'enterprise AI', 'data translation'],
  authors: [{ name: 'Jargon AI Team' }],
  creator: 'Jargon AI',
  publisher: 'Jargon AI, Inc.',
  robots: 'noindex, nofollow', // Since this is an admin interface
  icons: {
    icon: '/jargon-ai.png',
    shortcut: '/jargon-ai.png',
    apple: '/jargon-ai.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
