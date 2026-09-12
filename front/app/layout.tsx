import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AIChatFab } from '@/components/ai-chat-fab'
import { RealtimeProvider } from '@/components/realtime-provider'
import { ServiceWorkerRegistration } from './service-worker-registration'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'NestFind – Trouvez votre bien le plus rapidement',
  description: 'Parcourez les biens immobiliers intuitivement, sans le tracas d\'organiser une visite.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NestFind',
  },
  icons: {
    icon: [
      {
        url: '/logo-192.png',
        type: 'image/png',
        sizes: '192x192',
      },
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <RealtimeProvider>
          {children}
          <AIChatFab />
        </RealtimeProvider>
        <Analytics />
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
