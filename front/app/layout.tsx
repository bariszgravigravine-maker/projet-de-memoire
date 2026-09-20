import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { AIChatFab } from '@/components/ai-chat-fab'
import { RealtimeProvider } from '@/components/realtime-provider'
import { RouteGuard } from '@/components/route-guard'
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
    <html lang="fr">
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Perf carte : pré-connexion TLS vers MapTiler pendant le SSR pour
            que les premières tuiles arrivent plus vite, et préchargement du
            style.json utilisé par property-3d-map (garder l'URL en sync). */}
        <link rel="preconnect" href="https://api.maptiler.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.maptiler.com" />
        <link
          rel="preload"
          href="https://api.maptiler.com/maps/streets/style.json?key=pZbOuTTgEMlz7km8AJvW"
          as="fetch"
          crossOrigin="anonymous"
        />
        <RealtimeProvider>
          <RouteGuard>
            {children}
          </RouteGuard>
          <AIChatFab />
        </RealtimeProvider>
      </body>
    </html>
  )
}
